import { expect } from "@jest/globals";
import { IDS, REFERENCE_NOW } from "../data/syntheticStore.js";
import type { Decision, DenialCode } from "../utils/decision.js";

/** Trusted actors used across the tests. */
export const actors = {
  alice: { role: "patient", userId: IDS.patientAlice },
  bob: { role: "patient", userId: IDS.patientBob },
  alphaStaff: { role: "clinic_staff", orgId: IDS.clinicAlpha },
  betaStaff: { role: "clinic_staff", orgId: IDS.clinicBeta },
  tpaOneAdmin: { role: "benefits_admin", orgId: IDS.tpaOne },
  tpaTwoAdmin: { role: "benefits_admin", orgId: IDS.tpaTwo },
} as const;

export const calls = {
  appointmentRequest: (requestId: string, message?: unknown) => ({
    tool: "get_appointment_request",
    args: { requestId },
    ...(message === undefined ? {} : { message }),
  }),
  slot: (slotId: string, message?: unknown) => ({
    tool: "get_clinic_slot",
    args: { slotId },
    ...(message === undefined ? {} : { message }),
  }),
  adminTask: (taskId: string, message?: unknown) => ({
    tool: "get_admin_task",
    args: { taskId },
    ...(message === undefined ? {} : { message }),
  }),
};

/** REFERENCE_NOW shifted by a number of milliseconds. */
export function nowPlus(ms: number): Date {
  return new Date(REFERENCE_NOW.getTime() + ms);
}

export function expectDenied(decision: Decision, code: DenialCode): void {
  expect(decision.allowed).toBe(false);
  if (!decision.allowed) {
    expect(decision.error.code).toBe(code);
  }
}
