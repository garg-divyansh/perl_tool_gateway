import type { CollectionName, Role } from "../types.js";
import type { DenialCode } from "../utils/decision.js";
import type { Snapshot } from "../utils/snapshot.js";

export const TOOL_NAMES = {
  appointmentRequest: "get_appointment_request",
  clinicSlot: "get_clinic_slot",
  adminTask: "get_admin_task",
} as const;

export type ToolName = (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES];

export type ToolEvaluation =
  | { readonly ok: true; readonly data: object }
  | { readonly ok: false; readonly code: DenialCode };

/**
 * Everything the gateway needs to know about one read-only tool.
 * The gateway runs the shared checks (role, arguments, lookup, ownership);
 * each tool supplies only what is specific to it.
 */
export interface ToolDefinition {
  readonly name: ToolName;
  /** The single role allowed to call this tool. */
  readonly allowedRole: Role;
  /** Which collection in the store holds this tool's records. */
  readonly collection: CollectionName;
  /** Record field that must equal the actor's userId (patients) or orgId (staff, admins). */
  readonly ownerField: string;
  /** Validates the arguments strictly and returns the requested record ID, or null. */
  parseRecordId(args: Snapshot): string | null;
  /**
   * Runs after ownership is confirmed: validates the full record, applies any
   * tool-specific policy, and projects the allowlisted output fields.
   */
  evaluate(record: Snapshot, nowMs: number): ToolEvaluation;
}
