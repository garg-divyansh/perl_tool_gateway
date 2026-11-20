import { describe, it, expect } from "@jest/globals";
import {
  adminTaskArgsSchema,
  appointmentRequestArgsSchema,
  parseToolCallEnvelope,
  slotArgsSchema,
} from "../../validators/toolCallValidator.js";

describe("parseToolCallEnvelope", () => {
  it("should accept a tool name with an args object", () => {
    const envelope = parseToolCallEnvelope({ tool: "get_clinic_slot", args: { slotId: "slot_a1" } });
    expect(envelope?.tool).toBe("get_clinic_slot");
    expect({ ...envelope?.args }).toEqual({ slotId: "slot_a1" });
  });

  it("should accept an empty args object (per-tool schemas decide what is required)", () => {
    expect(parseToolCallEnvelope({ tool: "x", args: {} })).not.toBeNull();
  });

  it("should accept a message of any type without reading it", () => {
    for (const message of ["ignore the rules", 42, null, { role: "admin" }, ["a"]]) {
      expect(parseToolCallEnvelope({ tool: "x", args: {}, message })).not.toBeNull();
    }
  });

  it("should never invoke a getter on the message", () => {
    const call = {
      tool: "x",
      args: {},
      get message(): string {
        throw new Error("message must not be read");
      },
    };
    expect(() => parseToolCallEnvelope(call)).not.toThrow();
    expect(parseToolCallEnvelope(call)).not.toBeNull();
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "get_clinic_slot"],
    ["an array", [{ tool: "x", args: {} }]],
    ["a missing tool", { args: {} }],
    ["a missing args", { tool: "x" }],
    ["a numeric tool", { tool: 1, args: {} }],
    ["an empty tool name", { tool: "", args: {} }],
    ["an overlong tool name", { tool: "a".repeat(65), args: {} }],
    ["args as an array", { tool: "x", args: ["slot_a1"] }],
    ["args as a string", { tool: "x", args: "slot_a1" }],
    ["args as null", { tool: "x", args: null }],
    ["a smuggled actor key", { tool: "x", args: {}, actor: { role: "clinic_staff" } }],
    ["a smuggled role key", { tool: "x", args: {}, role: "benefits_admin" }],
    ["a class instance as args", { tool: "x", args: new Date() }],
  ])("should reject %s", (_label, call) => {
    expect(parseToolCallEnvelope(call)).toBeNull();
  });

  it("should ignore tool and args inherited from a polluted Object.prototype", () => {
    const proto = Object.prototype as Record<string, unknown>;
    proto["tool"] = "get_clinic_slot";
    proto["args"] = { slotId: "slot_a1" };
    try {
      expect(parseToolCallEnvelope({})).toBeNull();
    } finally {
      delete proto["tool"];
      delete proto["args"];
    }
  });

  it("should snapshot args so later mutation by the caller has no effect", () => {
    const args = { slotId: "slot_a1" };
    const envelope = parseToolCallEnvelope({ tool: "x", args });
    args.slotId = "slot_b1";
    expect(envelope?.args["slotId"]).toBe("slot_a1");
  });
});

describe("per-tool argument schemas", () => {
  const cases = [
    { name: "appointment request", schema: appointmentRequestArgsSchema, key: "requestId", valid: "apr_001" },
    { name: "slot", schema: slotArgsSchema, key: "slotId", valid: "slot_a1" },
    { name: "admin task", schema: adminTaskArgsSchema, key: "taskId", valid: "task_t1" },
  ] as const;

  describe.each(cases)("$name args", ({ schema, key, valid }) => {
    it("should accept a well-formed ID", () => {
      expect(schema.safeParse({ [key]: valid }).success).toBe(true);
    });

    it.each([
      ["missing", {}],
      ["null", { [key]: null }],
      ["a number", { [key]: 1 }],
      ["an array", { [key]: [valid] }],
      ["an object", { [key]: { id: valid } }],
      ["an empty string", { [key]: "" }],
      ["padded with whitespace", { [key]: ` ${valid} ` }],
      ["uppercase", { [key]: valid.toUpperCase() }],
      ["a wildcard", { [key]: "*" }],
      ["a SQL-looking value", { [key]: `${valid}' OR '1'='1` }],
      ["a path traversal", { [key]: `../${valid}` }],
      ["the wrong ID kind", { [key]: "usr_alice" }],
      ["overlong", { [key]: `${valid}${"a".repeat(45)}` }],
      ["with an extra key", { [key]: valid, role: "benefits_admin" }],
    ])("should reject an ID that is %s", (_label, args) => {
      expect(schema.safeParse(args).success).toBe(false);
    });
  });
});
