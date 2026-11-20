import { describe, it, expect } from "@jest/globals";
import { classifyFreshness, readClock } from "../../utils/time.js";

const WINDOW = 15 * 60 * 1000;
const NOW = Date.parse("2026-11-20T02:00:00.000Z");
const iso = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();

describe("readClock", () => {
  it("should return epoch milliseconds for a valid Date", () => {
    expect(readClock(new Date(NOW))).toBe(NOW);
  });

  it("should accept a Date subclass but ignore an overridden getTime()", () => {
    class SpoofedDate extends Date {
      override getTime(): number {
        return 0;
      }
    }
    expect(readClock(new SpoofedDate(NOW))).toBe(NOW);
  });

  it.each([
    ["an invalid Date", new Date("not a date")],
    ["an ISO string", "2026-11-20T02:00:00.000Z"],
    ["a number", NOW],
    ["null", null],
    ["undefined", undefined],
    ["a look-alike object", { getTime: () => NOW }],
  ])("should return null for %s", (_label, value) => {
    expect(readClock(value)).toBeNull();
  });
});

describe("classifyFreshness", () => {
  it.each([
    ["updated just now", 0, "fresh"],
    ["updated 5 minutes ago", -5 * 60 * 1000, "fresh"],
    ["exactly 15 minutes old", -WINDOW, "fresh"],
    ["15 minutes and 1 ms old", -WINDOW - 1, "stale"],
    ["a day old", -24 * 60 * 60 * 1000, "stale"],
    ["30 seconds in the future (within skew)", 30 * 1000, "fresh"],
    ["exactly 60 seconds in the future", 60 * 1000, "fresh"],
    ["60 seconds and 1 ms in the future", 60 * 1000 + 1, "unverifiable"],
    ["an hour in the future", 60 * 60 * 1000, "unverifiable"],
  ])("should classify a timestamp %s", (_label, offsetMs, expected) => {
    expect(classifyFreshness(iso(offsetMs), NOW, WINDOW)).toBe(expected);
  });

  it("should compare instants, not wall-clock text, across time zones", () => {
    // 09:55 in Singapore is 01:55 UTC: five minutes before NOW.
    expect(classifyFreshness("2026-11-20T09:55:00+08:00", NOW, WINDOW)).toBe("fresh");
    // 09:40 in Singapore is twenty minutes before NOW.
    expect(classifyFreshness("2026-11-20T09:40:00+08:00", NOW, WINDOW)).toBe("stale");
  });
});
