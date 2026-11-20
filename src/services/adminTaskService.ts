import { TOOL_NAMES, type ToolDefinition } from "../config/toolDefinition.js";
import { adminTaskArgsSchema } from "../validators/toolCallValidator.js";
import { adminTaskRecordSchema } from "../validators/recordValidator.js";

/**
 * What a benefits administrator sees: administrative status only.
 * Built from an allowlist, so clinical notes, appointment details and any
 * field added to the record in future are excluded unless added here on purpose.
 */
export interface AdminTaskView {
  id: string;
  taskType: string;
  adminStatus: string;
  updatedAt: string;
}

/** Benefits administrators may read only administrative tasks belonging to their organisation. */
export const adminTaskTool: ToolDefinition = {
  name: TOOL_NAMES.adminTask,
  allowedRole: "benefits_admin",
  collection: "adminTasks",
  ownerField: "orgId",

  parseRecordId(args) {
    const result = adminTaskArgsSchema.safeParse(args);
    return result.success ? result.data.taskId : null;
  },

  evaluate(record) {
    const result = adminTaskRecordSchema.safeParse(record);
    if (!result.success) {
      return { ok: false, code: "DATA_INTEGRITY_ERROR" };
    }
    const { id, taskType, adminStatus, updatedAt } = result.data;
    const view: AdminTaskView = { id, taskType, adminStatus, updatedAt };
    return { ok: true, data: view };
  },
};
