import { MAX_FUTURE_SKEW_MS } from "../config/constants.js";

/**
 * Reads the epoch milliseconds of a real Date, or returns null.
 *
 * Date.prototype.getTime.call() checks the internal date slot, so it rejects
 * look-alike objects and Date subclasses that override getTime(), and it
 * works for Dates created in other realms. Invalid Dates yield null.
 */
export function readClock(now: unknown): number | null {
  try {
    const ms = Date.prototype.getTime.call(now);
    return Number.isFinite(ms) ? ms : null;
  } catch {
    return null;
  }
}

export type FreshnessResult = "fresh" | "stale" | "unverifiable";

/**
 * Classifies a source timestamp against the current time.
 * - Older than `windowMs` is stale. Exactly `windowMs` old is still fresh,
 *   because the rule is "more than 15 minutes old".
 * - Further in the future than the allowed clock skew cannot be trusted.
 *
 * `sourceIso` must already be a validated ISO 8601 timestamp with an offset.
 */
export function classifyFreshness(
  sourceIso: string,
  nowMs: number,
  windowMs: number,
): FreshnessResult {
  const ageMs = nowMs - Date.parse(sourceIso);
  if (ageMs < -MAX_FUTURE_SKEW_MS) {
    return "unverifiable";
  }
  return ageMs > windowMs ? "stale" : "fresh";
}
