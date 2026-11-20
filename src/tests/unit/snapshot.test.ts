import { describe, it, expect } from "@jest/globals";
import { getOwn, isPlainObject, snapshotOwn } from "../../utils/snapshot.js";

class Example {
  field = 1;
}

describe("isPlainObject", () => {
  it("should accept object literals and null-prototype objects", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "text"],
    ["a number", 42],
    ["an array", []],
    ["a Date", new Date()],
    ["a Map", new Map()],
    ["a class instance", new Example()],
    ["a function", () => ({})],
  ])("should reject %s", (_label, value) => {
    expect(isPlainObject(value)).toBe(false);
  });
});

describe("snapshotOwn", () => {
  it("should return null for non-plain objects", () => {
    expect(snapshotOwn([1, 2])).toBeNull();
    expect(snapshotOwn("text")).toBeNull();
  });

  it("should copy own enumerable properties into a null-prototype object", () => {
    const copy = snapshotOwn({ a: 1, b: "two" });
    expect(copy).not.toBeNull();
    expect(Object.getPrototypeOf(copy)).toBeNull();
    expect({ ...copy }).toEqual({ a: 1, b: "two" });
  });

  it("should ignore inherited properties", () => {
    const parent = { inherited: "from parent" };
    const child = Object.create(parent) as Record<string, unknown>;
    child["own"] = "mine";
    // child is not a plain object (its prototype is `parent`), so it is rejected outright.
    expect(snapshotOwn(child)).toBeNull();

    const withNullProto = Object.assign(Object.create(null), { own: "mine" });
    const copy = snapshotOwn(withNullProto);
    expect(copy && "inherited" in copy).toBe(false);
  });

  it("should not see properties added to Object.prototype", () => {
    const proto = Object.prototype as Record<string, unknown>;
    proto["pollutedKey"] = "polluted";
    try {
      const copy = snapshotOwn({ a: 1 });
      expect(copy?.["pollutedKey"]).toBeUndefined();
    } finally {
      delete proto["pollutedKey"];
    }
  });

  it("should read each property exactly once", () => {
    let reads = 0;
    const source = {
      get value() {
        reads += 1;
        return reads === 1 ? "first" : "changed";
      },
    };
    const copy = snapshotOwn(source);
    expect(copy?.["value"]).toBe("first");
    expect(copy?.["value"]).toBe("first");
    expect(reads).toBe(1);
  });

  it("should never invoke getters on skipped keys", () => {
    const source = {
      safe: "ok",
      get skipped(): string {
        throw new Error("must not be read");
      },
    };
    expect(() => snapshotOwn(source, ["skipped"])).not.toThrow();
    expect(snapshotOwn(source, ["skipped"])?.["skipped"]).toBeUndefined();
  });

  it("should treat a __proto__ key from JSON as plain data", () => {
    const parsed: unknown = JSON.parse('{"__proto__": {"role": "admin"}, "a": 1}');
    const copy = snapshotOwn(parsed);
    expect(Object.getPrototypeOf(copy)).toBeNull();
    expect((copy as Record<string, unknown>)["role"]).toBeUndefined();
  });
});

describe("getOwn", () => {
  it("should return own values and ignore inherited ones", () => {
    const container = Object.assign(Object.create({ inherited: 1 }), { own: 2 }) as Record<
      string,
      unknown
    >;
    expect(getOwn(container, "own")).toBe(2);
    expect(getOwn(container, "inherited")).toBeUndefined();
    expect(getOwn(container, "missing")).toBeUndefined();
  });
});
