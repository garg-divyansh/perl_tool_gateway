import type { RecordStore } from "../types.js";

/**
 * Invented records for tests and demos. No real people, clinics or patient
 * information. Timestamps are relative to REFERENCE_NOW so freshness cases
 * stay correct no matter when the tests run.
 */

/** The fixed "current time" that the synthetic timestamps are built around. */
export const REFERENCE_NOW = new Date("2026-11-20T02:00:00.000Z");

function minutesBefore(minutes: number): string {
  return new Date(REFERENCE_NOW.getTime() - minutes * 60 * 1000).toISOString();
}

/** Named identities used across the synthetic data, so tests read clearly. */
export const IDS = {
  patientAlice: "usr_alice",
  patientBob: "usr_bob",
  clinicAlpha: "org_alphaclinic",
  clinicBeta: "org_betaclinic",
  tpaOne: "org_tpaone",
  tpaTwo: "org_tpatwo",
} as const;

/** Returns a fresh copy every call so one test can never affect another. */
export function createSyntheticStore(): RecordStore {
  return {
    appointmentRequests: {
      apr_001: {
        id: "apr_001",
        patientId: IDS.patientAlice,
        service: "Preventive health screening",
        preferredDate: "2026-12-01",
        status: "submitted",
        createdAt: minutesBefore(60 * 24),
      },
      apr_002: {
        id: "apr_002",
        patientId: IDS.patientBob,
        service: "Metabolic health review",
        preferredDate: "2026-12-03",
        status: "under_review",
        createdAt: minutesBefore(60 * 48),
      },
    },
    slots: {
      slot_alphafresh: {
        id: "slot_alphafresh",
        clinicId: IDS.clinicAlpha,
        service: "Preventive health screening",
        startsAt: "2026-11-21T01:30:00.000Z",
        durationMinutes: 30,
        sourceUpdatedAt: minutesBefore(5),
      },
      slot_alphaboundary: {
        id: "slot_alphaboundary",
        clinicId: IDS.clinicAlpha,
        service: "Lifestyle medicine consult",
        startsAt: "2026-11-21T03:00:00.000Z",
        durationMinutes: 45,
        sourceUpdatedAt: minutesBefore(15),
      },
      slot_alphastale: {
        id: "slot_alphastale",
        clinicId: IDS.clinicAlpha,
        service: "Preventive health screening",
        startsAt: "2026-11-21T05:00:00.000Z",
        durationMinutes: 30,
        sourceUpdatedAt: minutesBefore(16),
      },
      slot_betafresh: {
        id: "slot_betafresh",
        clinicId: IDS.clinicBeta,
        service: "Metabolic health review",
        startsAt: "2026-11-21T02:00:00.000Z",
        durationMinutes: 60,
        sourceUpdatedAt: minutesBefore(2),
      },
    },
    adminTasks: {
      task_oneeligibility: {
        id: "task_oneeligibility",
        orgId: IDS.tpaOne,
        taskType: "Eligibility verification",
        adminStatus: "in_review",
        updatedAt: minutesBefore(90),
        clinicalNotes: "SYNTHETIC: fasting glucose follow-up recommended.",
        appointmentDetails: { slotId: "slot_alphafresh", startsAt: "2026-11-21T01:30:00.000Z" },
      },
      task_twoclaim: {
        id: "task_twoclaim",
        orgId: IDS.tpaTwo,
        taskType: "Claim documentation",
        adminStatus: "pending_documents",
        updatedAt: minutesBefore(30),
        clinicalNotes: "SYNTHETIC: lipid panel results attached.",
      },
    },
  };
}
