import type { Actor } from "./types.js";
import { getTool } from "./config/toolRegistry.js";
import { allow, deny, type Decision } from "./utils/decision.js";
import { getOwn, isPlainObject, snapshotOwn } from "./utils/snapshot.js";
import { readClock } from "./utils/time.js";
import { parseActor } from "./validators/actorValidator.js";
import { parseToolCallEnvelope } from "./validators/toolCallValidator.js";

/** The value a record's owner field must match: a patient's userId or a staff/admin orgId. */
function actorScope(actor: Actor): string {
  return actor.role === "patient" ? actor.userId : actor.orgId;
}

/**
 * Decides whether a tool call proposed by an AI assistant is permitted.
 *
 * @param actor    Trusted identity from the application: `{ role, userId }` or `{ role, orgId }`.
 * @param toolCall Untrusted proposal from the assistant: `{ tool, args, message? }`.
 * @param store    In-memory store of synthetic records.
 * @param now      Current time as a Date, passed in so freshness is testable.
 *
 * Deny by default: the call is allowed only if every check below passes, and
 * any unexpected error is caught and turned into a denial (fail-secure).
 * The accompanying message is never read, so it cannot change permissions.
 * Inputs are typed `unknown` because every one is validated at runtime.
 */
export function evaluateToolCall(
  actor: unknown,
  toolCall: unknown,
  store: unknown,
  now: unknown,
): Decision {
  try {
    // 1. Application-supplied inputs. A failure here is a bug in the caller.
    const trustedActor = parseActor(actor);
    if (trustedActor === null) {
      return deny("INVALID_ACTOR");
    }
    const nowMs = readClock(now);
    if (nowMs === null) {
      return deny("INVALID_CLOCK");
    }
    if (!isPlainObject(store)) {
      return deny("STORE_UNAVAILABLE");
    }

    // 2. The assistant's proposal.
    const envelope = parseToolCallEnvelope(toolCall);
    if (envelope === null) {
      return deny("MALFORMED_TOOL_CALL");
    }
    const tool = getTool(envelope.tool);
    if (tool === undefined) {
      return deny("UNKNOWN_TOOL");
    }
    if (trustedActor.role !== tool.allowedRole) {
      return deny("ROLE_NOT_PERMITTED");
    }
    const recordId = tool.parseRecordId(envelope.args);
    if (recordId === null) {
      return deny("INVALID_ARGUMENTS");
    }

    // 3. Look up the record using own properties only.
    const collection = Object.hasOwn(store, tool.collection) ? store[tool.collection] : undefined;
    if (!isPlainObject(collection)) {
      return deny("STORE_UNAVAILABLE");
    }
    const record = snapshotOwn(Object.hasOwn(collection, recordId) ? collection[recordId] : undefined);

    // 4. Ownership, checked before anything else about the record is revealed.
    // A missing record and someone else's record produce the same denial,
    // so callers cannot probe which IDs exist.
    const owner = record === null ? undefined : getOwn(record, tool.ownerField);
    if (record === null || typeof owner !== "string" || owner !== actorScope(trustedActor)) {
      return deny("RECORD_NOT_FOUND");
    }

    // 5. The record must describe itself consistently before any field is trusted.
    if (getOwn(record, "id") !== recordId) {
      return deny("DATA_INTEGRITY_ERROR");
    }

    // 6. Tool-specific validation, policy (e.g. freshness) and output projection.
    const result = tool.evaluate(record, nowMs);
    return result.ok ? allow(tool.name, result.data) : deny(result.code);
  } catch {
    return deny("INTERNAL_ERROR");
  }
}
