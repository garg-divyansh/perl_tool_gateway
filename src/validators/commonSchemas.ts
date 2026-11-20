import { z } from "zod";
import { ID_PATTERNS } from "../config/constants.js";

// No .trim(), .toLowerCase() or coercion anywhere: a value either matches
// exactly or is rejected. Normalising IDs could turn " usr_bob" into a
// different user's valid ID.

export const userIdSchema = z.string().regex(ID_PATTERNS.userId);
export const orgIdSchema = z.string().regex(ID_PATTERNS.orgId);
export const requestIdSchema = z.string().regex(ID_PATTERNS.requestId);
export const slotIdSchema = z.string().regex(ID_PATTERNS.slotId);
export const taskIdSchema = z.string().regex(ID_PATTERNS.taskId);

/** ISO 8601 timestamp that must carry an explicit offset or Z, so it is never read in local time. */
export const isoTimestampSchema = z.iso.datetime({ offset: true });

/** Calendar date such as 2026-12-01. */
export const isoDateSchema = z.iso.date();

/** Short, bounded free-text field for synthetic record content. */
export const boundedTextSchema = z.string().min(1).max(200);
