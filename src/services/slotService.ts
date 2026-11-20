import { SLOT_FRESHNESS_WINDOW_MS } from "../config/constants.js";
import { TOOL_NAMES, type ToolDefinition } from "../config/toolDefinition.js";
import { classifyFreshness } from "../utils/time.js";
import { slotArgsSchema } from "../validators/toolCallValidator.js";
import { slotRecordSchema } from "../validators/recordValidator.js";

/** What clinic staff see about one of their clinic's slots. */
export interface SlotView {
  id: string;
  clinicId: string;
  service: string;
  startsAt: string;
  durationMinutes: number;
  sourceUpdatedAt: string;
}

/**
 * Clinic staff may read only slots belonging to their clinic, and only while
 * the slot's source update is at most 15 minutes old. Stale availability
 * could show a slot that has already been taken.
 */
export const slotTool: ToolDefinition = {
  name: TOOL_NAMES.clinicSlot,
  allowedRole: "clinic_staff",
  collection: "slots",
  ownerField: "clinicId",

  parseRecordId(args) {
    const result = slotArgsSchema.safeParse(args);
    return result.success ? result.data.slotId : null;
  },

  evaluate(record, nowMs) {
    const result = slotRecordSchema.safeParse(record);
    if (!result.success) {
      return { ok: false, code: "DATA_INTEGRITY_ERROR" };
    }
    const slot = result.data;

    const freshness = classifyFreshness(slot.sourceUpdatedAt, nowMs, SLOT_FRESHNESS_WINDOW_MS);
    if (freshness === "stale") {
      return { ok: false, code: "STALE_RECORD" };
    }
    if (freshness === "unverifiable") {
      return { ok: false, code: "FRESHNESS_UNVERIFIABLE" };
    }

    const view: SlotView = {
      id: slot.id,
      clinicId: slot.clinicId,
      service: slot.service,
      startsAt: slot.startsAt,
      durationMinutes: slot.durationMinutes,
      sourceUpdatedAt: slot.sourceUpdatedAt,
    };
    return { ok: true, data: view };
  },
};
