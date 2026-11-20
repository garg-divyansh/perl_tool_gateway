/**
 * Shared domain types. Runtime shapes are enforced by the Zod schemas in
 * src/validators; these types describe the values once they have passed.
 */

export type Role = "patient" | "clinic_staff" | "benefits_admin";

export interface PatientActor {
  role: "patient";
  userId: string;
}

export interface ClinicStaffActor {
  role: "clinic_staff";
  orgId: string;
}

export interface BenefitsAdminActor {
  role: "benefits_admin";
  orgId: string;
}

/** The trusted identity supplied by the application, never by the assistant. */
export type Actor = PatientActor | ClinicStaffActor | BenefitsAdminActor;

/** A tool call proposed by the assistant. Untrusted until validated. */
export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  /** Free text that may accompany the call. Treated as opaque data and never read. */
  message?: unknown;
}

export interface AppointmentRequestRecord {
  id: string;
  patientId: string;
  service: string;
  preferredDate: string;
  status: "submitted" | "under_review" | "matched" | "cancelled";
  createdAt: string;
}

export interface SlotRecord {
  id: string;
  clinicId: string;
  service: string;
  startsAt: string;
  durationMinutes: number;
  /** When the clinic's scheduling system last updated this slot. */
  sourceUpdatedAt: string;
}

export interface AdminTaskRecord {
  id: string;
  orgId: string;
  taskType: string;
  adminStatus: "open" | "pending_documents" | "in_review" | "closed";
  updatedAt: string;
  /** Sensitive: must never leave the gateway. */
  clinicalNotes?: string;
  /** Sensitive: must never leave the gateway. */
  appointmentDetails?: unknown;
}

/** The in-memory store of synthetic records, keyed by record ID. */
export interface RecordStore {
  appointmentRequests: Record<string, AppointmentRequestRecord>;
  slots: Record<string, SlotRecord>;
  adminTasks: Record<string, AdminTaskRecord>;
}

export type CollectionName = keyof RecordStore;
