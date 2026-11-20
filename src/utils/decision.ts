/**
 * Decision objects returned by the gateway.
 *
 * Denial messages are fixed strings per code. They never echo the tool name,
 * IDs or message from the request, so injected text cannot be reflected back
 * and an error never confirms whether a particular record exists.
 */

export const DENIAL_CODES = [
  "INVALID_ACTOR",
  "INVALID_CLOCK",
  "STORE_UNAVAILABLE",
  "MALFORMED_TOOL_CALL",
  "UNKNOWN_TOOL",
  "ROLE_NOT_PERMITTED",
  "INVALID_ARGUMENTS",
  "RECORD_NOT_FOUND",
  "DATA_INTEGRITY_ERROR",
  "STALE_RECORD",
  "FRESHNESS_UNVERIFIABLE",
  "INTERNAL_ERROR",
] as const;

export type DenialCode = (typeof DENIAL_CODES)[number];

const DENIAL_MESSAGES: Readonly<Record<DenialCode, string>> = {
  INVALID_ACTOR: "The application supplied an invalid actor.",
  INVALID_CLOCK: "The application supplied an invalid current time.",
  STORE_UNAVAILABLE: "The record store is unavailable.",
  MALFORMED_TOOL_CALL: "The tool call is malformed.",
  UNKNOWN_TOOL: "The requested tool is not available.",
  ROLE_NOT_PERMITTED: "Your role is not permitted to use this tool.",
  INVALID_ARGUMENTS: "The tool arguments are invalid.",
  // Deliberately identical for "does not exist" and "belongs to someone else".
  RECORD_NOT_FOUND: "No accessible record matches this request.",
  DATA_INTEGRITY_ERROR: "The record could not be read safely.",
  STALE_RECORD: "The record is too old to be trusted. Refresh the source and try again.",
  FRESHNESS_UNVERIFIABLE: "The record's freshness cannot be verified.",
  INTERNAL_ERROR: "The request could not be processed safely.",
};

export interface AllowDecision<TData> {
  readonly allowed: true;
  readonly tool: string;
  readonly data: Readonly<TData>;
}

export interface DenyDecision {
  readonly allowed: false;
  readonly error: { readonly code: DenialCode; readonly message: string };
}

export type Decision<TData = unknown> = AllowDecision<TData> | DenyDecision;

/**
 * Builds a frozen allow decision. `data` is always a fresh object of
 * primitive values built by a projection, so a shallow freeze makes it immutable.
 */
export function allow<TData extends object>(tool: string, data: TData): AllowDecision<TData> {
  return Object.freeze({ allowed: true, tool, data: Object.freeze(data) });
}

/** Builds a frozen deny decision with the fixed message for `code`. */
export function deny(code: DenialCode): DenyDecision {
  return Object.freeze({
    allowed: false,
    error: Object.freeze({ code, message: DENIAL_MESSAGES[code] }),
  });
}
