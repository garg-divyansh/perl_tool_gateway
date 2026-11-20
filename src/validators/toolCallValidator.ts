import { z } from "zod";
import { MAX_TOOL_NAME_LENGTH } from "../config/constants.js";
import { isPlainObject, snapshotOwn, type Snapshot } from "../utils/snapshot.js";
import { requestIdSchema, slotIdSchema, taskIdSchema } from "./commonSchemas.js";

const ALLOWED_ENVELOPE_KEYS: ReadonlySet<string> = new Set(["tool", "args", "message"]);

/** The tool call after envelope validation: a tool name and a snapshot of its args. */
export interface ToolCallEnvelope {
  tool: string;
  args: Snapshot;
}

/**
 * Validates the outer shape of a proposed tool call.
 *
 * The `message` key is allowed but its value is never read, so even a getter
 * on it cannot run. Any other extra top-level key (for example a smuggled
 * "actor" or "role") makes the call malformed. Own keys are listed once and
 * each value is read at most once. Argument contents are checked later by
 * the tool's own schema.
 */
export function parseToolCallEnvelope(input: unknown): ToolCallEnvelope | null {
  if (!isPlainObject(input)) {
    return null;
  }
  const keys = Object.keys(input);
  if (!keys.every((key) => ALLOWED_ENVELOPE_KEYS.has(key))) {
    return null;
  }

  const tool = keys.includes("tool") ? input["tool"] : undefined;
  if (typeof tool !== "string" || tool.length === 0 || tool.length > MAX_TOOL_NAME_LENGTH) {
    return null;
  }

  const args = snapshotOwn(keys.includes("args") ? input["args"] : undefined);
  if (args === null) {
    return null;
  }

  return { tool, args };
}

// Per-tool argument schemas. Strict, so unexpected keys (e.g. "role": "admin")
// are rejected instead of being ignored.

export const appointmentRequestArgsSchema = z.strictObject({ requestId: requestIdSchema });
export const slotArgsSchema = z.strictObject({ slotId: slotIdSchema });
export const adminTaskArgsSchema = z.strictObject({ taskId: taskIdSchema });
