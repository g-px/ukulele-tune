import { describe, expect, it } from "vitest";
import { Ema, MedianFilter } from "../../src/core/smoothing";

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

describe("Ema", () => {
  it("passes the first value and converges", () => {
    const e = new Ema(0.3);
    expect(e.value).toBeUndefined();
    expect(e.push(10)).toBe(10);
    let v = 0;
    for (let i = 0; i < 50; i++) v = e.push(20);
    expect(v).toBeCloseTo(20, 5);
    e.reset();
    expect(e.value).toBeUndefined();
  });
  it("rejects a bad alpha", () => {
    expect(() => new Ema(0)).toThrow();
    expect(() => new Ema(1.5)).toThrow();
  });
});
