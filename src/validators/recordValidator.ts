import { z } from "zod";
import {
  boundedTextSchema,
  isoDateSchema,
  isoTimestampSchema,
  orgIdSchema,
  requestIdSchema,
  slotIdSchema,
  taskIdSchema,
  userIdSchema,
} from "./commonSchemas.js";

// Records in the store are invented data, but the gateway still validates
// them before trusting a single field. A corrupted record is denied rather
// than partially returned. These are non-strict: extra fields are allowed in
// storage and simply dropped, because output is built from an allowlist.

export const appointmentRequestRecordSchema = z.object({
  id: requestIdSchema,
  patientId: userIdSchema,
  service: boundedTextSchema,
  preferredDate: isoDateSchema,
  status: z.enum(["submitted", "under_review", "matched", "cancelled"]),
  createdAt: isoTimestampSchema,
});

export const slotRecordSchema = z.object({
  id: slotIdSchema,
  clinicId: orgIdSchema,
  service: boundedTextSchema,
  startsAt: isoTimestampSchema,
  durationMinutes: z.number().int().positive().max(24 * 60),
  sourceUpdatedAt: isoTimestampSchema,
});

export const adminTaskRecordSchema = z.object({
  id: taskIdSchema,
  orgId: orgIdSchema,
  taskType: boundedTextSchema,
  adminStatus: z.enum(["open", "pending_documents", "in_review", "closed"]),
  updatedAt: isoTimestampSchema,
});
