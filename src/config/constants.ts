/**
 * Central policy constants. Kept in one place so a reviewer can see every
 * tunable rule of the gateway at a glance.
 */

/** A slot whose source update is older than this is treated as stale and denied. */
export const SLOT_FRESHNESS_WINDOW_MS = 15 * 60 * 1000;

/**
 * Tolerated clock skew for source timestamps that appear to be in the future.
 * Anything further ahead than this cannot be trusted, so freshness is unverifiable.
 */
export const MAX_FUTURE_SKEW_MS = 60 * 1000;

/** Upper bound on tool name length; anything longer is a malformed call, not a lookup. */
export const MAX_TOOL_NAME_LENGTH = 64;

/**
 * Identifier formats. Each kind has its own prefix so an ID of the wrong kind
 * (for example a slot ID passed to the admin task tool) fails validation.
 * Only lowercase ASCII letters and digits follow the prefix: no whitespace,
 * no Unicode lookalikes, nothing that needs normalising.
 */
export const ID_PATTERNS = {
  userId: /^usr_[a-z0-9]{1,40}$/,
  orgId: /^org_[a-z0-9]{1,40}$/,
  requestId: /^apr_[a-z0-9]{1,40}$/,
  slotId: /^slot_[a-z0-9]{1,40}$/,
  taskId: /^task_[a-z0-9]{1,40}$/,
} as const;
