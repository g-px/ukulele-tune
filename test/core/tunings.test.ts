import { describe, expect, it } from "vitest";
import {
  DEFAULT_TUNING_ID,
  TUNINGS,
  findTuning,
  getTuning,
  stringFrequency,
  tuningRange,
} from "../../src/core/tunings";

// Expected Hz at A4 = 440 from docs/knowledge/02-tunings.md, strings 4 -> 1.
const EXPECTED: Record<string, number[]> = {
  "c-high-g": [392.0, 261.63, 329.63, 440.0],
  "c-low-g": [196.0, 261.63, 329.63, 440.0],
  baritone: [146.83, 196.0, 246.94, 329.63],
  "d-high-a": [440.0, 293.66, 369.99, 493.88],
  "d-low-a": [220.0, 293.66, 369.99, 493.88],
  "slack-key": [392.0, 261.63, 329.63, 392.0],
  bb: [349.23, 233.08, 293.66, 392.0],
  "half-step-down": [369.99, 246.94, 311.13, 415.3],
  "vintage-g": [293.66, 196.0, 246.94, 329.63],
};

describe("TUNINGS", () => {
  it("has nine presets with unique ids", () => {
    expect(TUNINGS).toHaveLength(9);
    expect(new Set(TUNINGS.map((t) => t.id)).size).toBe(9);
    expect(Object.keys(EXPECTED).sort()).toEqual(TUNINGS.map((t) => t.id).sort());
  });

  it("orders strings 4 -> 1", () => {
    for (const t of TUNINGS) {
      expect(t.strings.map((s) => s.number)).toEqual([4, 3, 2, 1]);
    }
  });

  it("matches the reference frequency table", () => {
    for (const t of TUNINGS) {
      const hz = t.strings.map((s) => Number(stringFrequency(s, 440).toFixed(2)));
      expect(hz, t.id).toEqual(EXPECTED[t.id]);
    }
  });

  it("standard C and baritone use the documented MIDI numbers", () => {
    expect(getTuning("c-high-g").strings.map((s) => s.midi)).toEqual([67, 60, 64, 69]);
    expect(getTuning("baritone").strings.map((s) => s.midi)).toEqual([50, 55, 59, 64]);
  });

  it("re-entrant flag matches the 4th string being above the 3rd", () => {
    for (const t of TUNINGS) {
      const [s4, s3] = t.strings;
      expect(t.reentrant, t.id).toBe((s4?.midi ?? 0) > (s3?.midi ?? 0));
    }
  });

  it("octave partners point at each other and differ by 12 on string 4", () => {
    for (const t of TUNINGS) {
      if (!t.octavePartnerId) continue;
      const p = getTuning(t.octavePartnerId);
      expect(p.octavePartnerId).toBe(t.id);
      expect(Math.abs((t.strings[0]?.midi ?? 0) - (p.strings[0]?.midi ?? 0))).toBe(12);
    }
  });
});

describe("lookups", () => {
  it("default exists", () => {
    expect(getTuning(DEFAULT_TUNING_ID).short).toBe("gCEA");
  });
  it("unknown id", () => {
    expect(findTuning("nope")).toBeUndefined();
    expect(() => getTuning("nope")).toThrow(/Unknown tuning/);
  });
  it("tuningRange", () => {
    const r = tuningRange(getTuning("baritone"), 440);
    expect(r.min).toBeCloseTo(146.83, 2);
    expect(r.max).toBeCloseTo(329.63, 2);
  });
});
