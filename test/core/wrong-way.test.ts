import { describe, expect, it } from "vitest";
import { createWrongWayDetector, type WrongWayFrame } from "../../src/core/wrong-way";

const opts = { windowMs: 800, growCents: 15 };
const frame = (cents: number, timeMs: number, patch: Partial<WrongWayFrame> = {}) => ({
  cents,
  timeMs,
  noteActive: true,
  inTune: false,
  attack: false,
  ...patch,
});

/** Spread `cents` evenly over `ms` and return the detector output for each frame. */
function run(
  cents: number[],
  ms: number,
  patch: (i: number) => Partial<WrongWayFrame> = () => ({}),
) {
  const d = createWrongWayDetector(opts);
  const step = ms / Math.max(1, cents.length - 1);
  return cents.map((c, i) => d.push(frame(c, i * step, patch(i))));
}

describe("wrong-way detector", () => {
  it("fires when the note moves steadily further from the target", () => {
    const out = run([-20, -25, -30, -36], 700);
    expect(out).toEqual([false, false, false, true]);
  });

  it("stays quiet when the note moves toward the target", () => {
    expect(run([-36, -30, -25, -20], 700).some(Boolean)).toBe(false);
  });

  it("ignores small noise around a steady note", () => {
    const cents = Array.from({ length: 120 }, (_, i) => -20 + (i % 3) - 1.5);
    expect(run(cents, 2000).some(Boolean)).toBe(false);
  });

  it("a new pluck resets the trend", () => {
    const out = run([-20, -25, -30, -36], 700, (i) => ({ attack: i === 2 }));
    expect(out.some(Boolean)).toBe(false);
  });

  it("being in tune or losing the note resets it", () => {
    expect(run([-20, -25, -30, -36], 700, (i) => ({ inTune: i === 2 })).some(Boolean)).toBe(false);
    expect(run([-20, -25, -30, -36], 700, (i) => ({ noteActive: i !== 1 })).some(Boolean)).toBe(
      false,
    );
  });

  it("only looks at the last window", () => {
    // Slow growth over 3 s never reaches 15 cents within 800 ms.
    const cents = Array.from({ length: 60 }, (_, i) => -20 - i * 0.25);
    expect(run(cents, 3000).some(Boolean)).toBe(false);
  });

  it("reset() clears the samples", () => {
    const d = createWrongWayDetector(opts);
    d.push(frame(-20, 0));
    d.push(frame(-30, 300));
    d.reset();
    expect(d.push(frame(-36, 600))).toBe(false);
  });
});
