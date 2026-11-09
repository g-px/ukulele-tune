import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const FIXTURE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../test-results/audio",
);

/** Sustained string-like tone as 48 kHz 16-bit mono WAV (Chromium fake mic input). */
export function writeTone(name: string, freq: number, seconds = 4, sampleRate = 48000): string {
  return writeSequence(name, [{ freq, seconds }], sampleRate);
}

export interface Segment {
  /** 0 = silence. */
  freq: number;
  /** Glide linearly in cents from `freq` to this by the end of the segment. */
  toFreq?: number;
  seconds: number;
}

/** Several tones and gaps back to back in one WAV; Chromium loops the file. */
export function writeSequence(name: string, segments: Segment[], sampleRate = 48000): string {
  const harmonics = [1, 0.5, 0.3, 0.15, 0.08];
  const total = harmonics.reduce((a, b) => a + b, 0);
  const samples: number[] = [];
  let phase = 0;
  for (const { freq, toFreq, seconds } of segments) {
    const count = Math.floor(seconds * sampleRate);
    const glide = toFreq && freq > 0 ? Math.log2(toFreq / freq) : 0;
    for (let i = 0; i < count; i++) {
      const f = freq * 2 ** ((glide * i) / count);
      phase += (2 * Math.PI * f) / sampleRate;
      let v = 0;
      harmonics.forEach((a, k) => (v += a * Math.sin(phase * (k + 1))));
      samples.push(freq > 0 ? (v / total) * 0.5 : 0);
    }
  }
  const n = samples.length;
  const data = Buffer.alloc(44 + n * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(v * 32767), 44 + i * 2));
  data.write("RIFF", 0);
  data.writeUInt32LE(36 + n * 2, 4);
  data.write("WAVE", 8);
  data.write("fmt ", 12);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(sampleRate, 24);
  data.writeUInt32LE(sampleRate * 2, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(n * 2, 40);
  const path = join(FIXTURE_DIR, name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  return path;
}

export const TONES = {
  g4: { file: "g4.wav", freq: 392 * 2 ** (1 / 1200) },
  e4flat: { file: "e4-flat.wav", freq: 329.63 * 2 ** (-23 / 1200) },
  g3: { file: "g3.wav", freq: 196 },
  /** All-zero samples: a mic path that delivers nothing. */
  silence: { file: "silence.wav", freq: 0 },
};

/** G4 drifting from 20 to 70 cents flat: a peg turned the wrong way. */
export const WRONG_WAY = {
  file: "g4-drift.wav",
  segments: [
    { freq: 392 * 2 ** (-20 / 1200), seconds: 0.4 },
    { freq: 392 * 2 ** (-20 / 1200), toFreq: 392 * 2 ** (-70 / 1200), seconds: 1.6 },
  ],
};

/** Pluck string 4 then string 3, with gaps (setup listen step). */
export const SEQUENCES = {
  highG: {
    file: "g4-c4.wav",
    segments: [
      { freq: 392, seconds: 1.5 },
      { freq: 0, seconds: 0.5 },
      { freq: 261.63, seconds: 1.5 },
      { freq: 0, seconds: 0.5 },
    ],
  },
  lowG: {
    file: "g3-c4.wav",
    segments: [
      { freq: 196, seconds: 1.5 },
      { freq: 0, seconds: 0.5 },
      { freq: 261.63, seconds: 1.5 },
      { freq: 0, seconds: 0.5 },
    ],
  },
};
