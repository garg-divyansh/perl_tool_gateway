import { describe, it, expect } from "@jest/globals";
import { getTool, listToolNames } from "../../config/toolRegistry.js";

describe("tool registry", () => {
  it("should expose exactly the three read-only tools", () => {
    expect(listToolNames().sort()).toEqual([
      "get_admin_task",
      "get_appointment_request",
      "get_clinic_slot",
    ]);
  });

  it("should map each tool to exactly one role", () => {
    expect(getTool("get_appointment_request")?.allowedRole).toBe("patient");
    expect(getTool("get_clinic_slot")?.allowedRole).toBe("clinic_staff");
    expect(getTool("get_admin_task")?.allowedRole).toBe("benefits_admin");
  });

  it.each([
    "GET_CLINIC_SLOT",
    " get_clinic_slot",
    "get_clinic_slot ",
    "get-clinic-slot",
    "__proto__",
    "constructor",
    "toString",
    "hasOwnProperty",
  ])("should not resolve %j", (name) => {
    expect(getTool(name)).toBeUndefined();
  });
});
