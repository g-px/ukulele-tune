import { describe, expect, it } from "vitest";
import { dbfs, peak, rms } from "../../src/core/signal";
import { addNoiseSnr, mix, pluck, sine, whiteNoise } from "../helpers/signal";

describe("rms / dbfs", () => {
  it("rms of a 0.5 sine is about 0.3536", () => {
    expect(rms(sine(440, 48000, 48000, 0.5))).toBeCloseTo(0.3536, 3);
  });
  it("rms of an empty or silent buffer is 0", () => {
    expect(rms(new Float32Array(0))).toBe(0);
    expect(rms(new Float32Array(16))).toBe(0);
  });
  it("dbfs", () => {
    expect(dbfs(1)).toBe(0);
    expect(dbfs(0.1)).toBeCloseTo(-20, 10);
    expect(dbfs(0)).toBe(-Infinity);
  });
});

describe("peak", () => {
  it("is the largest absolute sample", () => {
    expect(peak(new Float32Array([0.1, -0.7, 0.3]))).toBeCloseTo(0.7, 6);
  });
  it("is exactly 0 for digital silence and empty buffers", () => {
    expect(peak(new Float32Array(64))).toBe(0);
    expect(peak(new Float32Array(0))).toBe(0);
  });
});

describe("test signal generators", () => {
  it("produce the requested length without NaN", () => {
    for (const b of [
      sine(440, 48000, 2048),
      pluck(196, 48000, 2048),
      whiteNoise(2048),
      mix(sine(100, 48000, 100), sine(200, 48000, 120)),
      addNoiseSnr(sine(262, 48000, 2048), 20),
    ]) {
      expect(b.length === 2048 || b.length === 100).toBe(true);
      expect(b.some(Number.isNaN)).toBe(false);
    }
  });
  it("noise is deterministic per seed", () => {
    expect(whiteNoise(8, 1, 3)).toEqual(whiteNoise(8, 1, 3));
    expect(whiteNoise(8, 1, 3)).not.toEqual(whiteNoise(8, 1, 4));
  });
  it("addNoiseSnr hits the requested SNR", () => {
    const clean = sine(262, 48000, 4800);
    const noisy = addNoiseSnr(clean, 20);
    const noise = noisy.map((v, i) => v - (clean[i] as number));
    expect(20 * Math.log10(rms(clean) / rms(noise))).toBeCloseTo(20, 1);
  });
});
