import { describe, it, expect } from "@jest/globals";
import {
  adminTaskRecordSchema,
  appointmentRequestRecordSchema,
  slotRecordSchema,
} from "../../validators/recordValidator.js";

const validRequest = {
  id: "apr_001",
  patientId: "usr_alice",
  service: "Health screening",
  preferredDate: "2026-12-01",
  status: "submitted",
  createdAt: "2026-11-18T09:00:00+08:00",
};

const validSlot = {
  id: "slot_a1",
  clinicId: "org_alpha",
  service: "Health screening",
  startsAt: "2026-11-21T10:00:00+08:00",
  durationMinutes: 30,
  sourceUpdatedAt: "2026-11-20T09:55:00+08:00",
};

const validTask = {
  id: "task_t1",
  orgId: "org_tpa1",
  taskType: "Eligibility check",
  adminStatus: "in_review",
  updatedAt: "2026-11-19T15:00:00+08:00",
  clinicalNotes: "Synthetic note",
};

describe("record schemas", () => {
  it("should accept well-formed records and drop unknown fields", () => {
    expect(appointmentRequestRecordSchema.safeParse(validRequest).success).toBe(true);
    expect(slotRecordSchema.safeParse(validSlot).success).toBe(true);
    const task = adminTaskRecordSchema.parse(validTask);
    expect(task).not.toHaveProperty("clinicalNotes");
  });

  it.each([
    ["an impossible date", { ...validRequest, preferredDate: "2026-02-30" }],
    ["an unknown status", { ...validRequest, status: "approved" }],
    ["a missing owner", { ...validRequest, patientId: undefined }],
    ["an owner of the wrong ID kind", { ...validRequest, patientId: "org_alpha" }],
  ])("should reject an appointment request with %s", (_label, record) => {
    expect(appointmentRequestRecordSchema.safeParse(record).success).toBe(false);
  });

  it.each([
    ["a timestamp without an offset", { ...validSlot, sourceUpdatedAt: "2026-11-20T09:55:00" }],
    ["an unparseable timestamp", { ...validSlot, sourceUpdatedAt: "yesterday" }],
    ["a numeric timestamp", { ...validSlot, sourceUpdatedAt: 1795140000000 }],
    ["an impossible time", { ...validSlot, sourceUpdatedAt: "2026-11-20T24:00:00Z" }],
    ["a zero duration", { ...validSlot, durationMinutes: 0 }],
    ["a fractional duration", { ...validSlot, durationMinutes: 1.5 }],
    ["a NaN duration", { ...validSlot, durationMinutes: Number.NaN }],
    ["a string duration", { ...validSlot, durationMinutes: "30" }],
    ["a missing clinic", { ...validSlot, clinicId: undefined }],
  ])("should reject a slot with %s", (_label, record) => {
    expect(slotRecordSchema.safeParse(record).success).toBe(false);
  });

  it.each([
    ["an unknown admin status", { ...validTask, adminStatus: "approved" }],
    ["an empty task type", { ...validTask, taskType: "" }],
    ["an overlong task type", { ...validTask, taskType: "x".repeat(201) }],
  ])("should reject an admin task with %s", (_label, record) => {
    expect(adminTaskRecordSchema.safeParse(record).success).toBe(false);
  });
});
