import { describe, expect, it } from "vitest";
import {
  currentString,
  skipGuideString,
  startGuide,
  stepGuide,
  type GuideState,
} from "../../src/core/guide";
import type { StringNumber } from "../../src/core/tunings";

const HOLD = 1000;

/** Feed in-tune frames for the current string from t0 for `ms`, every 20 ms. */
function holdInTune(s: GuideState, t0: number, ms: number): GuideState {
  const n = currentString(s);
  for (let t = t0; t <= t0 + ms; t += 20) {
    s = stepGuide(s, { stringNumber: n, inTune: true, timeMs: t }, HOLD);
  }
  return s;
}

describe("guided tuning", () => {
  it("starts on string 4, round 1", () => {
    const s = startGuide();
    expect(currentString(s)).toBe(4);
    expect(s.round).toBe(1);
  });

  it("advances only after a full second in tune", () => {
    expect(currentString(holdInTune(startGuide(), 0, 980))).toBe(4);
    expect(currentString(holdInTune(startGuide(), 0, 1000))).toBe(3);
  });

  it("a break in the hold restarts it", () => {
    let s = holdInTune(startGuide(), 0, 500);
    s = stepGuide(s, { stringNumber: 4, inTune: false, timeMs: 520 }, HOLD);
    s = holdInTune(s, 540, 900);
    expect(currentString(s)).toBe(4);
    s = holdInTune(s, 1460, 120);
    expect(currentString(s)).toBe(3);
  });

  it("ignores frames for another string", () => {
    let s = startGuide();
    for (let t = 0; t <= 2000; t += 20) {
      s = stepGuide(s, { stringNumber: 3, inTune: true, timeMs: t }, HOLD);
    }
    expect(currentString(s)).toBe(4);
  });

  it("goes 4, 3, 2, 1 twice, then is done", () => {
    let s = startGuide();
    const seen: Array<[StringNumber | null, number]> = [];
    let t = 0;
    while (!s.done) {
      seen.push([currentString(s), s.round]);
      s = holdInTune(s, t, HOLD);
      t += HOLD + 100;
    }
    expect(seen).toEqual([
      [4, 1],
      [3, 1],
      [2, 1],
      [1, 1],
      [4, 2],
      [3, 2],
      [2, 2],
      [1, 2],
    ]);
    expect(currentString(s)).toBeNull();
    expect(stepGuide(s, { stringNumber: 1, inTune: true, timeMs: t }, HOLD)).toBe(s);
  });

  it("skipping advances like a success", () => {
    let s = startGuide();
    for (let i = 0; i < 4; i++) s = skipGuideString(s);
    expect(currentString(s)).toBe(4);
    expect(s.round).toBe(2);
    for (let i = 0; i < 4; i++) s = skipGuideString(s);
    expect(s.done).toBe(true);
    expect(skipGuideString(s)).toBe(s);
  });
});
