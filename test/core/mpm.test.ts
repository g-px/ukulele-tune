import { describe, expect, it } from "vitest";
import { createPitchDetector } from "../../src/core/mpm";
import { centsBetween } from "../../src/core/pitch-math";
import { addNoiseSnr, pluck, sine, whiteNoise } from "../helpers/signal";

const SR = 48000;
const N = 2048;
const detector = createPitchDetector({
  sampleRate: SR,
  bufferSize: N,
  minFrequency: 100,
  maxFrequency: 1000,
});
const TARGETS = [146.83, 196, 246.94, 261.63, 293.66, 329.63, 369.99, 392, 440, 493.88];

function cents(f: number, ref: number) {
  return Math.abs(centsBetween(f, ref));
}

describe("MPM on pure sines", () => {
  it.each(TARGETS)("%f Hz within 1 cent, clarity > 0.97", (f) => {
    const r = detector.detect(sine(f, SR, N, 0.5));
    expect(cents(r.frequency, f)).toBeLessThan(1);
    expect(r.clarity).toBeGreaterThan(0.97);
  });

  it.each([-20, -5, 5, 20])("detects offsets of %d cents within 1 cent", (offset) => {
    for (const base of [196, 261.63, 440]) {
      const f = base * 2 ** (offset / 1200);
      const r = detector.detect(sine(f, SR, N, 0.5, 1.1));
      expect(cents(r.frequency, f)).toBeLessThan(1);
    }
  });

  it("works at 44.1 kHz and with a 4096 window", () => {
    const d = createPitchDetector({
      sampleRate: 44100,
      bufferSize: 4096,
      minFrequency: 100,
      maxFrequency: 1000,
    });
    for (const f of [146.83, 392]) {
      expect(cents(d.detect(sine(f, 44100, 4096)).frequency, f)).toBeLessThan(1);
    }
  });
});

describe("MPM on plucked-string signals", () => {
  it.each(TARGETS)("%f Hz: < 2 cents, clarity > 0.9, no octave error", (f) => {
    const r = detector.detect(pluck(f, SR, N));
    expect(cents(r.frequency, f)).toBeLessThan(2);
    expect(r.clarity).toBeGreaterThan(0.9);
  });

  it.each([196, 146.83])("strong 2nd harmonic at %f Hz does not cause an octave error", (f) => {
    const r = detector.detect(pluck(f, SR, N, [1, 0.9, 0.3, 0.2]));
    expect(cents(r.frequency, f)).toBeLessThan(100);
  });

  it("2nd harmonic louder than the fundamental still reads the fundamental", () => {
    const f = 196;
    const r = detector.detect(pluck(f, SR, N, [0.6, 1, 0.4, 0.2]));
    expect(cents(r.frequency, f)).toBeLessThan(100);
  });
});

describe("MPM rejection", () => {
  it("white noise has low clarity", () => {
    const r = detector.detect(whiteNoise(N, 0.3, 42));
    expect(r.clarity).toBeLessThan(0.6);
  });
  it("silence gives no pitch and no NaN", () => {
    expect(detector.detect(new Float32Array(N))).toEqual({ frequency: 0, clarity: 0 });
  });
  it("rejects pitches outside the range", () => {
    expect(detector.detect(sine(60, SR, N)).frequency).toBe(0);
    expect(detector.detect(sine(1500, SR, N)).frequency).toBe(0);
  });
  it("tolerates 20 dB SNR", () => {
    const r = detector.detect(addNoiseSnr(sine(262, SR, N), 20, 9));
    expect(cents(r.frequency, 262)).toBeLessThan(3);
  });
  it("throws on wrong buffer length and bad options", () => {
    expect(() => detector.detect(new Float32Array(N - 1))).toThrow(/Expected/);
    expect(() =>
      createPitchDetector({ sampleRate: SR, bufferSize: N, minFrequency: 500, maxFrequency: 100 }),
    ).toThrow(/Invalid/);
  });
  it("exposes resolved options", () => {
    expect(detector.options.keyMaximumRatio).toBe(0.93);
  });
});

describe("MPM performance", () => {
  it("100 detections of 2048 samples stay well under budget", () => {
    const buf = pluck(196, SR, N);
    const t0 = performance.now();
    for (let i = 0; i < 100; i++) detector.detect(buf);
    const ms = performance.now() - t0;
    console.log(`MPM: 100 x 2048 samples in ${ms.toFixed(1)} ms`);
    expect(ms).toBeLessThan(300);
  });
});
