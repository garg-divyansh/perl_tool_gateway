import { TOOL_NAMES, type ToolDefinition } from "../config/toolDefinition.js";
import { appointmentRequestArgsSchema } from "../validators/toolCallValidator.js";
import { appointmentRequestRecordSchema } from "../validators/recordValidator.js";

/** What a patient sees about their own appointment request. */
export interface AppointmentRequestView {
  id: string;
  service: string;
  preferredDate: string;
  status: string;
  createdAt: string;
}

/** Patients may read only their own synthetic appointment request. */
export const appointmentRequestTool: ToolDefinition = {
  name: TOOL_NAMES.appointmentRequest,
  allowedRole: "patient",
  collection: "appointmentRequests",
  ownerField: "patientId",

  parseRecordId(args) {
    const result = appointmentRequestArgsSchema.safeParse(args);
    return result.success ? result.data.requestId : null;
  },

  evaluate(record) {
    const result = appointmentRequestRecordSchema.safeParse(record);
    if (!result.success) {
      return { ok: false, code: "DATA_INTEGRITY_ERROR" };
    }
    const { id, service, preferredDate, status, createdAt } = result.data;
    const view: AppointmentRequestView = { id, service, preferredDate, status, createdAt };
    return { ok: true, data: view };
  },
};
