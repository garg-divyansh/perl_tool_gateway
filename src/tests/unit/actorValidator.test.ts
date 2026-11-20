import { describe, it, expect } from "@jest/globals";
import { parseActor } from "../../validators/actorValidator.js";

describe("parseActor", () => {
  it.each([
    [{ role: "patient", userId: "usr_alice" }],
    [{ role: "clinic_staff", orgId: "org_alpha" }],
    [{ role: "benefits_admin", orgId: "org_tpa1" }],
  ])("should accept a well-formed actor %j", (actor) => {
    expect(parseActor(actor)).toEqual(actor);
  });

  it("should accept a null-prototype actor object", () => {
    const actor = Object.assign(Object.create(null), { role: "patient", userId: "usr_alice" });
    expect(parseActor(actor)).toEqual({ role: "patient", userId: "usr_alice" });
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "patient"],
    ["an array", [{ role: "patient", userId: "usr_alice" }]],
    ["an empty object", {}],
    ["an unknown role", { role: "admin", userId: "usr_alice" }],
    ["a capitalised role", { role: "Patient", userId: "usr_alice" }],
    ["a role with whitespace", { role: " patient", userId: "usr_alice" }],
    ["a patient without userId", { role: "patient" }],
    ["a patient with orgId instead", { role: "patient", orgId: "org_alpha" }],
    ["a patient carrying both IDs", { role: "patient", userId: "usr_alice", orgId: "org_alpha" }],
    ["staff with userId instead", { role: "clinic_staff", userId: "usr_alice" }],
    ["staff carrying both IDs", { role: "clinic_staff", orgId: "org_alpha", userId: "usr_alice" }],
    ["an admin without orgId", { role: "benefits_admin" }],
    ["an empty userId", { role: "patient", userId: "" }],
    ["a whitespace userId", { role: "patient", userId: "   " }],
    ["a padded userId", { role: "patient", userId: " usr_alice" }],
    ["an uppercase userId", { role: "patient", userId: "USR_ALICE" }],
    ["a userId with a trailing newline", { role: "patient", userId: "usr_alice\n" }],
    ["a userId with a Cyrillic lookalike", { role: "patient", userId: "usr_аlice" }],
    ["a numeric userId", { role: "patient", userId: 123 }],
    ["an overlong userId", { role: "patient", userId: `usr_${"a".repeat(41)}` }],
    ["an orgId in the userId slot", { role: "patient", userId: "org_alpha" }],
    ["an extra permission field", { role: "patient", userId: "usr_alice", isAdmin: true }],
  ])("should reject %s", (_label, actor) => {
    expect(parseActor(actor)).toBeNull();
  });

  it("should not pick up a userId inherited from a polluted Object.prototype", () => {
    const proto = Object.prototype as Record<string, unknown>;
    proto["userId"] = "usr_alice";
    try {
      expect(parseActor({ role: "patient" })).toBeNull();
    } finally {
      delete proto["userId"];
    }
  });

  it("should reject an actor whose prototype is not Object.prototype", () => {
    class FakeActor {
      role = "patient";
      userId = "usr_alice";
    }
    expect(parseActor(new FakeActor())).toBeNull();
  });
});
