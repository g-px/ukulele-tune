import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const FIXTURE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../test-results/audio",
);

/** Sustained string-like tone as 48 kHz 16-bit mono WAV (Chromium fake mic input). */
export function writeTone(name: string, freq: number, seconds = 4, sampleRate = 48000): string {
  const n = Math.floor(seconds * sampleRate);
  const data = Buffer.alloc(44 + n * 2);
  const harmonics = [1, 0.5, 0.3, 0.15, 0.08];
  const total = harmonics.reduce((a, b) => a + b, 0);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    let v = 0;
    harmonics.forEach((a, k) => (v += a * Math.sin(2 * Math.PI * freq * (k + 1) * t)));
    data.writeInt16LE(Math.round((v / total) * 0.5 * 32767), 44 + i * 2);
  }
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
