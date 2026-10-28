import { createFft } from "./fft";

/**
 * McLeod Pitch Method (McLeod & Wyvill, "A Smarter Way to Find Pitch", 2005).
 * Normalised square difference function + key-maximum picking + parabolic
 * interpolation. Returns the pitch and a clarity score in [0, 1].
 */

export interface PitchDetectorOptions {
  sampleRate: number;
  bufferSize: number;
  minFrequency: number;
  maxFrequency: number;
  /** Fraction of the highest key maximum a peak must reach to be chosen. */
  keyMaximumRatio?: number;
}

export interface PitchResult {
  /** Hz, or 0 when no pitch was found. */
  frequency: number;
  clarity: number;
}

export interface PitchDetector {
  detect(buffer: Float32Array): PitchResult;
  readonly options: Required<PitchDetectorOptions>;
}

const NONE: PitchResult = { frequency: 0, clarity: 0 };

export function createPitchDetector(opts: PitchDetectorOptions): PitchDetector {
  const options: Required<PitchDetectorOptions> = { keyMaximumRatio: 0.93, ...opts };
  const { sampleRate, bufferSize, minFrequency, maxFrequency, keyMaximumRatio } = options;
  if (!(sampleRate > 0 && bufferSize >= 4 && minFrequency > 0 && maxFrequency > minFrequency)) {
    throw new Error("Invalid pitch detector options");
  }
  // Largest lag worth computing (+1 so the last peak can be interpolated).
  const maxLag = Math.min(Math.floor(bufferSize / 2), Math.ceil(sampleRate / minFrequency) + 1);
  const nsdf = new Float64Array(maxLag + 1);
  // Autocorrelation via FFT (Wiener-Khinchin), zero-padded to avoid wrap-around.
  let fftSize = 2;
  while (fftSize < 2 * bufferSize) fftSize <<= 1;
  const fft = createFft(fftSize);
  const re = new Float64Array(fftSize);
  const im = new Float64Array(fftSize);

  function computeNsdf(x: Float32Array): void {
    const n = x.length;
    re.fill(0);
    im.fill(0);
    let energy = 0;
    for (let i = 0; i < n; i++) {
      const v = x[i] as number;
      re[i] = v;
      energy += v * v;
    }
    fft.forward(re, im);
    for (let i = 0; i < fftSize; i++) {
      const r = re[i] as number;
      const q = im[i] as number;
      re[i] = r * r + q * q;
      im[i] = 0;
    }
    fft.inverse(re, im); // re[tau] is now the autocorrelation at lag tau
    // m(tau) = sum_{j<n-tau} x[j]^2 + x[j+tau]^2, updated incrementally.
    let m = 2 * energy;
    for (let tau = 0; tau <= maxLag; tau++) {
      if (tau > 0) {
        const a = x[tau - 1] as number;
        const b = x[n - tau] as number;
        m -= a * a + b * b;
      }
      nsdf[tau] = m > 1e-9 ? (2 * (re[tau] as number)) / m : 0;
    }
  }

  /** Indices of the highest point of each positive lobe after the zero-lag lobe. */
  function keyMaxima(): number[] {
    const peaks: number[] = [];
    let tau = 1;
    while (tau < maxLag && (nsdf[tau] as number) > 0) tau++; // leave the zero-lag lobe
    let best = -1;
    for (; tau < maxLag; tau++) {
      const prev = nsdf[tau - 1] as number;
      const cur = nsdf[tau] as number;
      if (prev <= 0 && cur > 0)
        best = tau; // positive-going zero crossing
      else if (prev > 0 && cur <= 0) {
        if (best > 0) peaks.push(best);
        best = -1;
      } else if (best > 0 && cur > (nsdf[best] as number)) best = tau;
    }
    // An unfinished lobe counts only if its maximum is a real peak, not the edge.
    if (best > 0 && best < maxLag - 1) peaks.push(best);
    return peaks;
  }

  function detect(buffer: Float32Array): PitchResult {
    if (buffer.length !== bufferSize) {
      throw new Error(`Expected ${bufferSize} samples, got ${buffer.length}`);
    }
    computeNsdf(buffer);
    const peaks = keyMaxima();
    if (peaks.length === 0) return NONE;

    let highest = 0;
    for (const p of peaks) highest = Math.max(highest, nsdf[p] as number);
    if (highest <= 0) return NONE;
    const threshold = keyMaximumRatio * highest;
    const tau = peaks.find((p) => (nsdf[p] as number) >= threshold) as number;

    const a = nsdf[tau - 1] as number;
    const b = nsdf[tau] as number;
    const c = nsdf[tau + 1] as number;
    const denom = a - 2 * b + c;
    const delta = denom === 0 ? 0 : (0.5 * (a - c)) / denom;
    const lag = tau + delta;
    const peak = b - 0.25 * (a - c) * delta;

    const frequency = sampleRate / lag;
    if (!(frequency >= minFrequency && frequency <= maxFrequency)) return NONE;
    return { frequency, clarity: Math.min(1, Math.max(0, peak)) };
  }

  return { detect, options };
}
