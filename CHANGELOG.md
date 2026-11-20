# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-20

### Added

- Added `evaluateToolCall`, a deny-by-default gateway that decides whether a proposed tool call is permitted.
- Added three read-only tools: `get_appointment_request` (patients, own requests only), `get_clinic_slot` (clinic staff, own clinic, at most 15 minutes stale) and `get_admin_task` (benefits administrators, own organisation, administrative status only).
- Added strict Zod schemas for actors, tool calls, tool arguments and stored records.
- Added null-prototype input snapshots to block prototype pollution and values that change between reads.
- Added uniform `RECORD_NOT_FOUND` denials so other tenants' records cannot be enumerated.
- Added allowlisted output projections so clinical fields can never leave the gateway.
- Added an invented record store and a fixed reference clock for tests.
- Added unit, gateway and adversarial test suites with a 100% coverage gate.
- Added CI (typecheck, lint, tests, build on Node 22 and 24) and security CI (CodeQL, TruffleHog, npm audit).
- Added a Husky pre-push hook with npm audit and gitleaks.
- Added Dependabot for npm and GitHub Actions, grouping dev-dependency updates and pinning TypeScript and `@types/node` to supported versions.
