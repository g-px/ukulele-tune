import { describe, expect, it } from "vitest";
import { DIAL, arcPath, centsToAngle, polar, tick, zonePath } from "../../src/core/needle-geometry";

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
