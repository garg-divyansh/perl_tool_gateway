import { describe, it, expect } from "@jest/globals";
import { allow, deny, DENIAL_CODES } from "../../utils/decision.js";

describe("deny", () => {
  it.each(DENIAL_CODES)("should give %s a fixed, non-empty message", (code) => {
    const decision = deny(code);
    expect(decision.allowed).toBe(false);
    expect(decision.error.code).toBe(code);
    expect(decision.error.message.length).toBeGreaterThan(0);
  });

  it("should give every code a distinct message", () => {
    const messages = DENIAL_CODES.map((code) => deny(code).error.message);
    expect(new Set(messages).size).toBe(DENIAL_CODES.length);
  });

  it("should return a deeply frozen decision", () => {
    const decision = deny("UNKNOWN_TOOL");
    expect(Object.isFrozen(decision)).toBe(true);
    expect(Object.isFrozen(decision.error)).toBe(true);
  });
});

describe("allow", () => {
  it("should return a frozen decision with frozen data", () => {
    const decision = allow("get_clinic_slot", { id: "slot_a" });
    expect(decision).toEqual({ allowed: true, tool: "get_clinic_slot", data: { id: "slot_a" } });
    expect(Object.isFrozen(decision)).toBe(true);
    expect(Object.isFrozen(decision.data)).toBe(true);
  });
});
