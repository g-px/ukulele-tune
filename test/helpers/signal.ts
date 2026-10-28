/** Deterministic synthetic signals for detector tests. */

export function sine(freq: number, sampleRate: number, n: number, amp = 0.5, phase = 0) {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++)
    out[i] = amp * Math.sin((2 * Math.PI * freq * i) / sampleRate + phase);
  return out;
}

/**
 * Plucked-string approximation: harmonics[k] is the amplitude of harmonic k+1,
 * each decaying exponentially (higher harmonics decay faster).
 */
export function pluck(
  freq: number,
  sampleRate: number,
  n: number,
  harmonics: number[] = [1, 0.6, 0.4, 0.25, 0.15, 0.1],
  decayPerSecond = 3,
  peak = 0.5,
) {
  const out = new Float32Array(n);
  const total = harmonics.reduce((a, b) => a + b, 0);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    let v = 0;
    harmonics.forEach((a, k) => {
      const h = k + 1;
      v += a * Math.exp(-decayPerSecond * h * t) * Math.sin(2 * Math.PI * freq * h * t + h * 0.3);
    });
    out[i] = (peak * v) / total;
  }
  return out;
}

/** mulberry32: tiny seeded PRNG so noise tests are reproducible. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function whiteNoise(n: number, amp = 0.3, seed = 1) {
  const r = rng(seed);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = amp * (r() * 2 - 1);
  return out;
}

export function mix(...buffers: Float32Array[]) {
  const n = Math.min(...buffers.map((b) => b.length));
  const out = new Float32Array(n);
  for (const b of buffers)
    for (let i = 0; i < n; i++) out[i] = (out[i] as number) + (b[i] as number);
  return out;
}

function rmsOf(b: Float32Array) {
  let s = 0;
  for (const v of b) s += v * v;
  return Math.sqrt(s / b.length);
}

export function addNoiseSnr(buffer: Float32Array, snrDb: number, seed = 7) {
  const noise = whiteNoise(buffer.length, 1, seed);
  const scale = rmsOf(buffer) / 10 ** (snrDb / 20) / rmsOf(noise);
  const out = new Float32Array(buffer.length);
  for (let i = 0; i < buffer.length; i++)
    out[i] = (buffer[i] as number) + scale * (noise[i] as number);
  return out;
}
