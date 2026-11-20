import { z } from "zod";
import type { Actor } from "../types.js";
import { orgIdSchema, userIdSchema } from "./commonSchemas.js";
import { snapshotOwn } from "../utils/snapshot.js";

/**
 * The actor comes from the application (e.g. a verified session), so it is
 * trusted for identity. It is still validated: a malformed actor is an
 * application bug, and the safe response to a bug is to deny.
 *
 * Strict objects mean a patient carrying an orgId, or staff carrying a
 * userId, is rejected rather than silently accepted.
 */
export const actorSchema = z.discriminatedUnion("role", [
  z.strictObject({ role: z.literal("patient"), userId: userIdSchema }),
  z.strictObject({ role: z.literal("clinic_staff"), orgId: orgIdSchema }),
  z.strictObject({ role: z.literal("benefits_admin"), orgId: orgIdSchema }),
]);

/** Returns the validated actor, or null if it is not a well-formed actor. */
export function parseActor(input: unknown): Actor | null {
  const snapshot = snapshotOwn(input);
  if (snapshot === null) {
    return null;
  }
  const result = actorSchema.safeParse(snapshot);
  return result.success ? result.data : null;
}
