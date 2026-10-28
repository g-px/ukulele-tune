import { describe, expect, it } from "vitest";
import { matchString, nearestString } from "../../src/core/string-select";
import { getTuning } from "../../src/core/tunings";

const C_HIGH = getTuning("c-high-g");
const C_LOW = getTuning("c-low-g");
const BARI = getTuning("baritone");

describe("nearestString", () => {
  it("picks the string whose target is nearest", () => {
    const g = nearestString(392, C_HIGH, 440);
    expect(g.string.number).toBe(4);
    expect(g.cents).toBeCloseTo(0, 1);
    expect(g.octaveHint).toBe("none");

    const e = nearestString(330, C_HIGH, 440);
    expect(e.string.number).toBe(2);
    expect(e.cents).toBeCloseTo(1.96, 1);
  });

  it("flags a low-G string on a high-G tuning", () => {
    const m = nearestString(196, C_HIGH, 440);
    expect(m.string.number).toBe(4);
    expect(m.cents).toBeCloseTo(-1200, 1);
    expect(m.octaveHint).toBe("octave-low");
    expect(m.partnerTuningId).toBe("c-low-g");
  });

  it("flags a high-G string on a low-G tuning", () => {
    // G4 on a low-G tuning: without the hint it would read "A string, 200 cents flat".
    const m = nearestString(392, C_LOW, 440);
    expect(m.string.number).toBe(4);
    expect(m.octaveHint).toBe("octave-high");
    expect(m.partnerTuningId).toBe("c-high-g");
  });

  it("uses the octave hint only when no string is close", () => {
    // 530 Hz is near C5, an octave above the C string, and > 100 cents from A4.
    const m = nearestString(530, C_HIGH, 440);
    expect(m.string.number).toBe(3);
    expect(m.octaveHint).toBe("octave-high");
    expect(m.partnerTuningId).toBeUndefined();
  });

  it("returns the nearest string without a hint when nothing matches an octave", () => {
    const m = nearestString(600, C_HIGH, 440);
    expect(m.octaveHint).toBe("none");
    expect(m.string.number).toBe(1);
    const close = nearestString(230, C_HIGH, 440);
    expect(close.string.number).toBe(3);
    expect(close.octaveHint).toBe("none");
  });

  it("a slightly loose string is never mistaken for an octave error", () => {
    const e = nearestString(329.63 * 2 ** (-90 / 1200), C_HIGH, 440);
    expect(e.string.number).toBe(2);
    expect(e.octaveHint).toBe("none");
  });

  it("baritone: 196 Hz is the G string", () => {
    expect(nearestString(196, BARI, 440).string.number).toBe(3);
  });

  it("respects A4", () => {
    expect(nearestString(442, C_HIGH, 442).cents).toBeCloseTo(0, 6);
  });
});

describe("matchString", () => {
  it("measures against a fixed string", () => {
    const e = C_HIGH.strings[2];
    if (!e) throw new Error("missing string");
    const m = matchString(262, e, 440);
    expect(m.cents).toBeCloseTo(-397.5, 1);
    expect(m.octaveHint).toBe("none");
  });
});
