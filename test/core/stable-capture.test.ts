import { describe, expect, it } from "vitest";
import { createStableCapture } from "../../src/core/stable-capture";

const FRAME_MS = 16.7;
const opts = { minMs: 300, toleranceCents: 30 };
const detune = (hz: number, cents: number) => hz * 2 ** (cents / 1200);

/** Push one value per frame starting at t = 0; return [frame index, value] of the first capture. */
function feed(values: number[]): [number, number] | null {
  const c = createStableCapture(opts);
  for (let i = 0; i < values.length; i++) {
    const r = c.push(values[i] ?? 0, i * FRAME_MS);
    if (r !== null) return [i, r];
  }
  return null;
}

describe("stable capture", () => {
  it("captures a steady pitch once it has lasted the minimum time", () => {
    const hit = feed(Array.from({ length: 25 }, () => 392));
    expect(hit).not.toBeNull();
    const [frame, hz] = hit ?? [0, 0];
    expect(frame).toBe(Math.ceil(300 / FRAME_MS));
    expect(hz).toBe(392);
  });

  it("tolerates small jitter and returns the median", () => {
    const values = Array.from({ length: 25 }, (_, i) => detune(392, i % 2 ? 10 : -10));
    const hit = feed(values);
    const cents = 1200 * Math.log2((hit?.[1] ?? 0) / 392);
    expect(Math.abs(cents)).toBeLessThanOrEqual(10 + 1e-9);
  });

  it("restarts the run on a jump bigger than the tolerance", () => {
    const values = Array.from({ length: 40 }, (_, i) =>
      i * FRAME_MS < 200 ? 392 : detune(392, 60),
    );
    const jumpFrame = values.findIndex((v) => v !== 392);
    const hit = feed(values);
    expect(hit).not.toBeNull();
    expect(((hit?.[0] ?? 0) - jumpFrame) * FRAME_MS).toBeGreaterThanOrEqual(300);
    expect(hit?.[1]).toBeCloseTo(detune(392, 60), 6);
  });

  it("a frame without pitch restarts the run", () => {
    const values = Array.from({ length: 40 }, () => 392);
    values[9] = 0; // ≈150 ms
    const hit = feed(values);
    expect(((hit?.[0] ?? 0) - 10) * FRAME_MS).toBeGreaterThanOrEqual(300);
  });

  it("returns null after a capture until reset", () => {
    const c = createStableCapture(opts);
    let captured = 0;
    for (let i = 0; i < 60; i++) if (c.push(392, i * FRAME_MS) !== null) captured++;
    expect(captured).toBe(1);
    c.reset();
    for (let i = 0; i < 25; i++) if (c.push(262, 1000 + i * FRAME_MS) !== null) captured++;
    expect(captured).toBe(2);
  });
});
