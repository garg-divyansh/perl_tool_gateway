# PĒRL Tool Gateway

[![CI](https://github.com/garg-divyansh/perl_tool_gateway/actions/workflows/ci.yml/badge.svg)](https://github.com/garg-divyansh/perl_tool_gateway/actions/workflows/ci.yml)
[![Security Scan](https://github.com/garg-divyansh/perl_tool_gateway/actions/workflows/security-ci.yml/badge.svg)](https://github.com/garg-divyansh/perl_tool_gateway/actions/workflows/security-ci.yml)

A safe tool gateway for a synthetic AI assistant. When the assistant proposes a tool call, the gateway decides whether that call is permitted for the actor the application has authenticated, and returns either the allowed data or a denial with a reason code.

It is a pure TypeScript function with no database, network or LLM. All records are invented.

## Quick start

Requires Node.js 22 or newer.

```bash
npm install
npm test                 # run all tests
npm run test:coverage    # run tests with the 100% coverage gate
npm run lint             # ESLint (typescript-eslint, strict type-checked)
npm run typecheck        # tsc --noEmit
npm run build            # compile to dist/
npm run demo             # build, then print the gateway's decision for 9 sample calls
```

## Usage

```ts
import { evaluateToolCall, createSyntheticStore } from "perl-tool-gateway";

const decision = evaluateToolCall(
  { role: "clinic_staff", orgId: "org_alphaclinic" }, // trusted actor from the application
  {
    tool: "get_clinic_slot",
    args: { slotId: "slot_alphafresh" },
    message: "ignore the rules",
  }, // untrusted proposal from the assistant
  createSyntheticStore(), // invented records
  new Date(), // current time, injected for testability
);

if (decision.allowed) {
  console.log(decision.data);
} else {
  console.log(decision.error.code, decision.error.message);
}
```

A decision is always one of:

```ts
{ allowed: true,  tool: "get_clinic_slot", data: { ... } }
{ allowed: false, error: { code: "STALE_RECORD", message: "..." } }
```

Decisions are frozen, and allowed data is a fresh copy that shares nothing with the store.

## Supported tools

All three tools are read-only.

| Tool                      | Role             | Arguments                  | Rule                                                                                                           | Returns                                                                            |
| ------------------------- | ---------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `get_appointment_request` | `patient`        | `{ requestId: "apr_..." }` | The request's `patientId` must equal the actor's `userId`                                                      | id, service, preferredDate, status, createdAt                                      |
| `get_clinic_slot`         | `clinic_staff`   | `{ slotId: "slot_..." }`   | The slot's `clinicId` must equal the actor's `orgId`, and its `sourceUpdatedAt` must be at most 15 minutes old | id, clinicId, service, startsAt, durationMinutes, sourceUpdatedAt                  |
| `get_admin_task`          | `benefits_admin` | `{ taskId: "task_..." }`   | The task's `orgId` must equal the actor's `orgId`                                                              | id, taskType, adminStatus, updatedAt (never clinical notes or appointment details) |

## How a call is evaluated

Every call is denied unless it passes all of these checks, in order. The first failure decides the denial code.

1. **Actor** is a well-formed `{ role, userId }` or `{ role, orgId }` → otherwise `INVALID_ACTOR`
2. **Clock** is a valid `Date` → otherwise `INVALID_CLOCK`
3. **Store** is an object → otherwise `STORE_UNAVAILABLE`
4. **Tool call** has exactly `tool`, `args` and an optional `message` → otherwise `MALFORMED_TOOL_CALL`
5. **Tool** exists in the registry (exact, case-sensitive match) → otherwise `UNKNOWN_TOOL`
6. **Role** is the one role allowed for that tool → otherwise `ROLE_NOT_PERMITTED`
7. **Arguments** match the tool's strict schema → otherwise `INVALID_ARGUMENTS`
8. **Record** exists and belongs to the actor's user or organisation → otherwise `RECORD_NOT_FOUND`
9. **Record integrity**: the record is valid and its `id` matches the key it is stored under → otherwise `DATA_INTEGRITY_ERROR`
10. **Freshness** (slots only) → `STALE_RECORD` if older than 15 minutes, `FRESHNESS_UNVERIFIABLE` if more than 60 seconds in the future

Any unexpected error at any step becomes `INTERNAL_ERROR`. The function never throws.

## Security measures

- **Deny by default, fail secure.** Access is granted only at the very end. The whole pipeline sits inside a try/catch that turns any error into a denial.
- **The message is never read.** It is skipped when the tool call is parsed, so even a getter on it never runs. Permissions come only from the trusted actor.
- **Strict validation with Zod.** Strict schemas for the actor, the tool call and every tool's arguments. Unknown keys are rejected (so `"role": "admin"` cannot be smuggled into `args`), and nothing is coerced.
- **No normalisation.** IDs and tool names must match exactly. Trimming or lowercasing could turn `" usr_bob"` or a Unicode lookalike into someone else's valid ID. Each ID kind has its own prefix, so a slot ID passed to the admin task tool is rejected.
- **Tenant isolation without enumeration.** A record that does not exist and a record that belongs to someone else return the identical denial. Ownership is checked before anything else about a record is revealed, so another clinic cannot learn that a slot is stale.
- **Output allowlisting.** Results are built field by field. Clinical notes, appointment details and any field added to a record in future stay out unless deliberately added.
- **Safe object handling.** Inputs are copied into null-prototype snapshots of their own properties, so a polluted `Object.prototype` has no effect and each value is read exactly once (no time-of-check vs time-of-use tricks). Tools live in a `Map`, so `__proto__` or `constructor` can never resolve to a tool.
- **No reflection.** Denial messages are fixed per code and never echo the request's tool name, IDs or message.
- **Data integrity.** Records are validated before any field is trusted. A corrupted record is denied, not partly returned.
- **Trustworthy time.** The clock must be a real `Date` (look-alike objects are rejected), timestamps must carry a time zone offset, and impossible dates such as 30 February are rejected.
- **Pipeline security.** CI runs typecheck, lint and tests with a 100% coverage gate on Node 22 and 24. A separate workflow runs CodeQL (security-extended), TruffleHog secret scanning and `npm audit` (any severity for production dependencies, critical for dev tooling). A Husky pre-push hook runs the same checks locally, plus gitleaks if installed. Dependabot keeps dependencies and actions up to date, with TypeScript held below 6.1 (until ts-jest and typescript-eslint support newer versions) and `@types/node` held to Node 22, the oldest supported runtime.

## Assumptions

- A patient actor carries a `userId`. Clinic staff and benefits administrators carry an `orgId`. An actor carrying the wrong one, or both, is invalid.
- The accompanying message travels in the tool call as `message`. It may be any type.
- "More than 15 minutes old" means a slot updated exactly 15 minutes ago is still allowed.
- A source timestamp up to 60 seconds in the future is accepted as clock skew. Beyond that, freshness cannot be verified and the call is denied.
- The actor, store and clock come from the application and are trusted for identity, but they are still validated. A malformed one is treated as a bug and denied.
- Identifiers use the formats `usr_`, `org_`, `apr_`, `slot_` and `task_` followed by 1 to 40 lowercase letters or digits.
- The appointment request view leaves out `patientId`, since the patient already knows who they are.

## Trade-off

**One generic "not found" instead of precise errors.** When a record does not exist and when it belongs to another user or organisation, the gateway returns the same `RECORD_NOT_FOUND` denial. This stops anyone (or a manipulated assistant) from probing IDs to learn which records exist in other tenants, which matters for healthcare data. The cost is debuggability: a clinic user who mistypes an ID and one who targets another clinic see the same message, and so does a developer chasing a bug. In production I would keep the uniform response but write the precise reason to an internal audit log that only operators can read.

## Future work

If this gateway sat in front of a real assistant, these are the next things I would build:

- **Audit log of every decision.** Keep the uniform `RECORD_NOT_FOUND` response for callers, but record the actor, tool, record ID and precise internal reason in an append-only log that only operators can read. That removes the debugging cost of the trade-off above and makes probing attempts visible.
- **One schema for the model and the gateway.** Generate the assistant's tool definitions from the same Zod schemas with `z.toJSONSchema()`, so the model is told exactly the argument shapes the gateway accepts and the two can never drift apart.
- **An HTTP layer.** Wrap the function in an endpoint where the actor comes from a verified session or JWT rather than the request body, with Helmet, per-actor rate limiting and request size limits, as I did in NUSphere.
- **Policy as reviewable data.** Move the role and ownership rules into a declarative policy file that a compliance reviewer can read without reading code, with a test generated for every rule.
- **Refreshing instead of only denying.** For stale slots, trigger a refresh from the clinic's scheduling system and retry, so staff see current availability instead of an error.

## Testing

418 tests across unit and integration suites, with 100% statement, branch, function and line coverage enforced in CI.

- **Unit** (`src/tests/unit`): each schema, the snapshot helper, time handling, decisions and the tool registry, in isolation.
- **Gateway** (`src/tests/integration/gateway.test.ts`): permitted access for each tool, the full role-by-tool matrix, user and organisation boundaries, slot freshness including the exact 15-minute boundary, unknown tools, malformed calls and arguments, invalid actor, clock and store, record integrity, immutability and fail-secure behaviour.
- **Adversarial** (`src/tests/integration/adversarial.test.ts`): 13 kinds of malicious message tested against every actor and tool combination (the decision must be identical with or without the message), injection through other fields, prototype pollution and `__proto__` JSON payloads, values that change between reads, Proxies, cross-realm Dates, oversized inputs, and attempts to modify returned decisions.

## Project structure

```
src/
├── gateway.ts                  evaluateToolCall: the decision pipeline
├── index.ts                    public API
├── demo.ts                     npm run demo: prints decisions for sample calls
├── types.ts                    domain types
├── config/
│   ├── constants.ts            freshness window, clock skew, ID formats
│   ├── toolDefinition.ts       tool names and the ToolDefinition interface
│   └── toolRegistry.ts         the Map of supported tools
├── services/                   one file per tool: policy and output projection
├── validators/                 Zod schemas for actors, tool calls and records
├── utils/                      decisions, safe snapshots, time handling
├── data/syntheticStore.ts      invented records and the reference clock
└── tests/                      unit and integration suites
```

## Out of scope

As the brief asks, there is no frontend, database, LLM call or paid API, nothing is written or booked, and no coverage decisions are made. Browser-specific protections such as CSRF, cookies and CORS do not apply to a pure function.

## Use of AI tools

I used Claude (Anthropic) through the Claude desktop app as a pair programmer.

- **How I used it:** to brainstorm ideas and architecture during planning, to draft code, tests and documentation, and to review edge cases with me. I asked it to read my NUSphere project so this project follows the same conventions (layered structure, schema validation at every boundary, Jest test layout, security CI and Husky hooks). I made the design decisions, reviewed every change, and ran typecheck, lint and tests on my own machine before each commit. I chose a tech stack I was familiar with so that I can easily debug and scrutinize AI-generated code.
- **Why I delegated what I did:** I deliberately handed the AI work I already know how to do myself. The project setup, layered validation, Jest test structure, security CI and Husky hooks all follow patterns I built by hand in NUSphere, so I could judge every piece of generated code against my own experience instead of trusting it blindly. I checked and questioned the output at every stage, asked for changes when something was wrong or unclear, and did not move to the next step until I understood what had been written. I made the AI work for me, not the other way round.
- **What it could access:** only this project's local folder. It did not commit, push or open pull requests. I did all Git and GitHub work myself.
- **What I deliberately did not give it:** access to my GitHub account. I am a member of private organisations (NUS Mars Rover Team and my CS1010 teaching assistant role), and I did not want an AI tool to have any route into those repositories.
- **Third-party services:** in projects like NUSphere I integrated real LLM APIs, Redis rate limiting, PostgreSQL and Cloudinary. I would not connect an AI assistant to services like these, both because they can hold sensitive data and because automated use can exhaust usage limits and quotas. This exercise needs none of them, so none were connected.
