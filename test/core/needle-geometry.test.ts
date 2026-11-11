import { describe, expect, it } from "vitest";
import {
  DIAL,
  arcPath,
  centsToAngle,
  polar,
  springStep,
  tick,
  zonePath,
} from "../../src/core/needle-geometry";

describe("needle geometry", () => {
  it("maps cents to angle and clamps at the dial ends", () => {
    expect(centsToAngle(0)).toBe(0);
    expect(centsToAngle(1)).toBeCloseTo(0.9, 10);
    expect(centsToAngle(-23)).toBeCloseTo(-20.7, 10);
    expect(centsToAngle(-1198)).toBe(-45);
    expect(centsToAngle(80)).toBe(45);
    expect(centsToAngle(Number.NaN)).toBe(0);
  });

  it("polar matches the drawn arc ends", () => {
    const left = polar(DIAL.arcRadius, -45);
    expect(left.x).toBeCloseTo(61.9, 1);
    expect(left.y).toBeCloseTo(76.9, 1);
    const top = polar(DIAL.arcRadius, 0);
    expect(top.x).toBeCloseTo(175, 6);
    expect(top.y).toBeCloseTo(30, 6);
  });

  it("builds the track arc", () => {
    expect(arcPath(160, -45, 45)).toBe("M 61.86 76.86 A 160 160 0 0 1 288.14 76.86");
  });

  it("builds the in-tune zone for ±5 cents like the design", () => {
    expect(zonePath(5)).toBe(
      "M 161.66 20.52 A 170 170 0 0 1 188.34 20.52 L 185.98 50.43 A 140 140 0 0 0 164.02 50.43 Z",
    );
    expect(zonePath(3)).not.toBe(zonePath(5));
  });

  it("places ticks on the arc", () => {
    expect(tick(-50)).toEqual({ x1: 61.86, y1: 76.86, x2: 75.3, y2: 90.3 });
  });
});

describe("springStep", () => {
  const STIFFNESS = 25;
  const run = (seconds: number, frameSeconds: number) => {
    let s = { position: 0, velocity: 0 };
    for (let t = 0; t < seconds - 1e-9; t += frameSeconds) {
      s = springStep(s, 10, frameSeconds, STIFFNESS);
    }
    return s;
  };

  it("glides to the target without overshoot", () => {
    let s = { position: 0, velocity: 0 };
    let previous = 0;
    for (let i = 0; i < 60; i++) {
      s = springStep(s, 10, 1 / 60, STIFFNESS);
      expect(s.position).toBeGreaterThanOrEqual(previous);
      expect(s.position).toBeLessThanOrEqual(10);
      previous = s.position;
    }
    expect(s.position).toBeCloseTo(10, 3);
    expect(s.velocity).toBeCloseTo(0, 2);
  });

  it("is most of the way there after 0.2 s and starts gently", () => {
    expect(run(0.2, 1 / 60).position).toBeGreaterThan(9.5);
    expect(springStep({ position: 0, velocity: 0 }, 10, 1 / 60, STIFFNESS).position).toBeLessThan(
      1,
    );
  });

  it("does not depend on the frame rate", () => {
    const at60 = run(0.1, 1 / 60).position;
    expect(run(0.1, 1 / 30).position).toBeCloseTo(at60, 9);
    expect(run(0.1, 1 / 120).position).toBeCloseTo(at60, 9);
  });

  it("keeps its speed when the target moves, and ignores a zero step", () => {
    const moving = springStep({ position: 0, velocity: 0 }, 10, 0.05, STIFFNESS);
    expect(moving.velocity).toBeGreaterThan(0);
    const retargeted = springStep(moving, 4, 1 / 60, STIFFNESS);
    expect(retargeted.position).toBeGreaterThan(moving.position);
    expect(springStep(moving, 4, 0, STIFFNESS)).toBe(moving);
  });
});
