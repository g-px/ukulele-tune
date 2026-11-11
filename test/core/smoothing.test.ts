import { describe, expect, it } from "vitest";
import {
  MedianFilter,
  PitchFilter,
  StickyRound,
  type PitchFilterOptions,
} from "../../src/core/smoothing";
import { rng } from "../helpers/signal";

describe("MedianFilter", () => {
  it("ignores a single outlier", () => {
    const m = new MedianFilter(5);
    let out = 0;
    for (const v of [392, 392, 784, 392, 392]) out = m.push(v);
    expect(out).toBe(392);
  });
  it("averages the middle pair for even counts and slides the window", () => {
    const m = new MedianFilter(3);
    expect(m.push(1)).toBe(1);
    expect(m.push(3)).toBe(2);
    expect(m.push(10)).toBe(3);
    expect(m.push(20)).toBe(10);
    m.reset();
    expect(m.push(7)).toBe(7);
  });
  it("rejects size 0", () => {
    expect(() => new MedianFilter(0)).toThrow();
  });
});

const OPTIONS: PitchFilterOptions = {
  driftCents: 3,
  noiseFloorCents: 0.5,
  noisePerClarity: 200,
  trendMs: 150,
  trendDeadband: 0.35,
  chase: 8,
};
const FRAME_MS = 1000 / 60;

/** Feed `count` frames; returns the outputs. */
function feed(
  f: PitchFilter,
  count: number,
  value: (i: number) => number,
  clarity: number,
  startMs = 0,
  frameMs = FRAME_MS,
) {
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(f.push(value(i), clarity, startMs + i * frameMs));
  return out;
}

describe("PitchFilter", () => {
  it("passes the first value through and reports it", () => {
    const f = new PitchFilter(OPTIONS);
    expect(f.value).toBeUndefined();
    expect(f.push(100, 0.99, 0)).toBe(100);
    expect(f.value).toBe(100);
    f.reset();
    expect(f.value).toBeUndefined();
  });

  it("follows a clear note within a few frames", () => {
    const f = new PitchFilter(OPTIONS);
    f.push(0, 0.999, 0);
    const out = feed(f, 9, () => 10, 0.999, FRAME_MS);
    expect(out[8]).toBeGreaterThan(9.5);
  });

  it("smooths an unclear note far more than a clear one", () => {
    const noise = rng(7);
    const jitter = Array.from({ length: 240 }, () => (noise() - 0.5) * 20);
    const spread = (clarity: number) => {
      const f = new PitchFilter(OPTIONS);
      const tail = feed(f, 240, (i) => jitter[i] as number, clarity).slice(60);
      return Math.max(...tail) - Math.min(...tail);
    };
    expect(spread(0.93)).toBeLessThan(3);
    expect(spread(0.93)).toBeLessThan(spread(0.999) / 4);
  });

  it("catches up when an unclear note keeps moving the same way", () => {
    const f = new PitchFilter(OPTIONS);
    feed(f, 30, () => 0, 0.95);
    // 30 cents per second for one second, then steady.
    const ramp = feed(f, 60, (i) => (i + 1) * 0.5, 0.95, 30 * FRAME_MS);
    expect(30 - (ramp[59] as number)).toBeLessThan(8);
    const after = feed(f, 30, () => 30, 0.95, 90 * FRAME_MS);
    expect(Math.abs(30 - (after[29] as number))).toBeLessThan(1.5);
  });

  it("gives the same answer at 30, 60 and 120 frames per second", () => {
    const at = (fps: number) => {
      const f = new PitchFilter(OPTIONS);
      f.push(0, 0.97, 0);
      return feed(f, fps / 2, () => 10, 0.97, 1000 / fps, 1000 / fps).at(-1) as number;
    };
    expect(Math.abs(at(30) - at(60))).toBeLessThan(0.7);
    expect(Math.abs(at(120) - at(60))).toBeLessThan(0.7);
  });

  it("takes the next frame as it comes after loosen()", () => {
    const f = new PitchFilter(OPTIONS);
    feed(f, 60, () => 0, 0.93);
    f.loosen();
    expect(f.push(25, 0.93, 61 * FRAME_MS)).toBe(25);
  });

  it("rejects bad options", () => {
    expect(() => new PitchFilter({ ...OPTIONS, driftCents: 0 })).toThrow();
    expect(() => new PitchFilter({ ...OPTIONS, noiseFloorCents: 0 })).toThrow();
    expect(() => new PitchFilter({ ...OPTIONS, trendMs: 0 })).toThrow();
  });
});

describe("StickyRound", () => {
  it("does not flip between two whole numbers near the midpoint", () => {
    const r = new StickyRound(0.3);
    expect(r.push(2.4)).toBe(2);
    expect(r.push(2.6)).toBe(2);
    expect(r.push(2.75)).toBe(2);
    expect(r.push(2.85)).toBe(3);
    expect(r.push(2.45)).toBe(3);
    expect(r.push(2.15)).toBe(2);
  });
  it("follows large moves at once and resets", () => {
    const r = new StickyRound(0.3);
    expect(r.push(0.2)).toBe(0);
    expect(r.push(-7.6)).toBe(-8);
    r.reset();
    expect(r.push(2.6)).toBe(3);
  });
  it("rejects a margin of half or more", () => {
    expect(() => new StickyRound(0.5)).toThrow();
  });
});
