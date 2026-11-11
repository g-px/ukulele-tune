/**
 * A rough model of a plucked ukulele string through a phone microphone, for
 * stability tests: it goes sharp on the attack, has slightly stretched
 * partials, beats between its two polarisations, decays, and sits on noise.
 */
import { rng } from "./signal";

export interface PluckOptions {
  /** Pitch the string settles on, Hz. */
  freq: number;
  sampleRate: number;
  seconds: number;
  /** Cents sharp at the instant of the pluck, decaying over ~0.25 s. */
  attackSharpCents?: number;
  /** Detuning between the two polarisations, Hz (causes slow beating). */
  beatHz?: number;
  /** Amplitude decay of the fundamental, 1/s. */
  decayPerSecond?: number;
  peak?: number;
  /** RMS of the white noise floor, dBFS. */
  noiseDbfs?: number;
  seed?: number;
  /** Extra detuning over time in cents (a peg being turned). */
  bendCents?: (seconds: number) => number;
}

const PARTIALS = [1, 0.6, 0.4, 0.25, 0.15, 0.1];
const INHARMONICITY = 1e-4;

export function pluckedString(o: PluckOptions): Float32Array {
  const {
    freq,
    sampleRate,
    seconds,
    attackSharpCents = 8,
    beatHz = 0.4,
    decayPerSecond = 1.2,
    peak = 0.3,
    noiseDbfs = -58,
    seed = 1,
    bendCents,
  } = o;
  const n = Math.round(seconds * sampleRate);
  const out = new Float32Array(n);
  const rand = rng(seed);
  const noiseAmp = 10 ** (noiseDbfs / 20) * Math.sqrt(3);
  const total = PARTIALS.reduce((a, b) => a + b, 0);
  const phases = PARTIALS.map(() => [0, 0]);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const offset = attackSharpCents * Math.exp(-t / 0.25) + (bendCents ? bendCents(t) : 0);
    const f = freq * 2 ** (offset / 1200);
    let v = 0;
    PARTIALS.forEach((amp, k) => {
      const h = k + 1;
      const stretch = Math.sqrt(1 + INHARMONICITY * h * h);
      const env = Math.exp(-decayPerSecond * (1 + 0.5 * k) * t);
      const ph = phases[k] as number[];
      ph[0] = (ph[0] as number) + (2 * Math.PI * f * h * stretch) / sampleRate;
      ph[1] = (ph[1] as number) + (2 * Math.PI * (f + beatHz) * h * stretch) / sampleRate;
      v += amp * env * (Math.sin(ph[0] as number) + 0.5 * Math.sin((ph[1] as number) + 1));
    });
    out[i] = (peak * v) / (1.5 * total) + noiseAmp * (2 * rand() - 1);
  }
  return out;
}

/** The last `size` samples before `timeMs`, as an analyser would return them. */
export function windowAt(signal: Float32Array, sampleRate: number, timeMs: number, size: number) {
  const end = Math.min(signal.length, Math.round((timeMs / 1000) * sampleRate));
  const out = new Float32Array(size);
  const start = end - size;
  for (let i = 0; i < size; i++) {
    const j = start + i;
    out[i] = j >= 0 ? (signal[j] as number) : 0;
  }
  return out;
}
