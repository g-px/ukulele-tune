import { describe, expect, it } from "vitest";
import { createFft } from "../../src/core/fft";
import { rng } from "../helpers/signal";

function naiveDft(re: number[], im: number[]) {
  const n = re.length;
  const outRe: number[] = [];
  const outIm: number[] = [];
  for (let k = 0; k < n; k++) {
    let sr = 0;
    let si = 0;
    for (let t = 0; t < n; t++) {
      const a = (-2 * Math.PI * k * t) / n;
      sr += (re[t] as number) * Math.cos(a) - (im[t] as number) * Math.sin(a);
      si += (re[t] as number) * Math.sin(a) + (im[t] as number) * Math.cos(a);
    }
    outRe.push(sr);
    outIm.push(si);
  }
  return { outRe, outIm };
}

describe("fft", () => {
  it("matches a naive DFT and round-trips", () => {
    const r = rng(5);
    const n = 64;
    const re0 = Array.from({ length: n }, () => r() - 0.5);
    const im0 = Array.from({ length: n }, () => r() - 0.5);
    const fft = createFft(n);
    const re = Float64Array.from(re0);
    const im = Float64Array.from(im0);
    fft.forward(re, im);
    const { outRe, outIm } = naiveDft(re0, im0);
    for (let k = 0; k < n; k++) {
      expect(re[k]).toBeCloseTo(outRe[k] as number, 9);
      expect(im[k]).toBeCloseTo(outIm[k] as number, 9);
    }
    fft.inverse(re, im);
    for (let k = 0; k < n; k++) {
      expect(re[k]).toBeCloseTo(re0[k] as number, 12);
      expect(im[k]).toBeCloseTo(im0[k] as number, 12);
    }
    expect(fft.size).toBe(n);
  });
  it("rejects sizes that are not powers of two", () => {
    expect(() => createFft(12)).toThrow(/power of two/);
    expect(() => createFft(1)).toThrow();
  });
});
