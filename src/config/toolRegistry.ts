import type { ToolDefinition } from "./toolDefinition.js";
import { appointmentRequestTool } from "../services/appointmentRequestService.js";
import { slotTool } from "../services/slotService.js";
import { adminTaskTool } from "../services/adminTaskService.js";

/**
 * The only tools the gateway knows about. A Map is used instead of a plain
 * object so names like "__proto__", "constructor" or "toString" can never
 * resolve to something inherited.
 */
const registry: ReadonlyMap<string, ToolDefinition> = new Map(
  [appointmentRequestTool, slotTool, adminTaskTool].map((tool) => [tool.name, tool]),
);

/** Exact, case-sensitive lookup. No trimming or normalising of the requested name. */
export function getTool(name: string): ToolDefinition | undefined {
  return registry.get(name);
}

/** Names of all supported tools, for documentation and tests. */
export function listToolNames(): string[] {
  return [...registry.keys()];
}
