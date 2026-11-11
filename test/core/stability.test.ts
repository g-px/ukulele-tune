/**
 * End-to-end stability of the reading: a modelled plucked string goes through
 * the real detector and tuner with the shipped constants.
 */
import { describe, expect, it } from "vitest";
import {
  ATTACK_JUMP_DB,
  ATTACK_SKIP_MS,
  CENTS_STICKINESS,
  CLARITY_THRESHOLD,
  DEFAULT_BUFFER_SIZE,
  DEFAULT_GATE_DBFS,
  HOLD_MS,
  IN_TUNE_ENTER_MS,
  IN_TUNE_EXIT_FACTOR,
  IN_TUNE_EXIT_MS,
  MAX_FREQ,
  MEDIAN_SIZE,
  MIN_FREQ,
  PITCH_FILTER,
} from "../../src/config";
import { createPitchDetector } from "../../src/core/mpm";
import { midiToFreq } from "../../src/core/pitch-math";
import { dbfs, rms } from "../../src/core/signal";
import { createTuner, type TunerReading } from "../../src/core/tuner";
import { getTuning } from "../../src/core/tunings";
import { pluckedString, windowAt, type PluckOptions } from "../helpers/string-sim";

const SAMPLE_RATE = 48000;
const G4 = midiToFreq(67, 440);
/** Half the analysis window: the detector reports the pitch of a moment ago. */
const WINDOW_LAG_S = DEFAULT_BUFFER_SIZE / SAMPLE_RATE / 2;

interface Row extends TunerReading {
  timeMs: number;
}

function play(options: Partial<PluckOptions> & { cents?: number }, fps = 60): Row[] {
  const { cents = 0, ...rest } = options;
  const signal = pluckedString({
    freq: G4 * 2 ** (cents / 1200),
    sampleRate: SAMPLE_RATE,
    seconds: 4,
    ...rest,
  });
  const detector = createPitchDetector({
    sampleRate: SAMPLE_RATE,
    bufferSize: DEFAULT_BUFFER_SIZE,
    minFrequency: MIN_FREQ,
    maxFrequency: MAX_FREQ,
  });
  const tuner = createTuner({
    a4: 440,
    tuning: getTuning("c-high-g"),
    mode: { kind: "auto" },
    flats: false,
    inTuneCents: 5,
    clarityThreshold: CLARITY_THRESHOLD,
    gateDbfs: DEFAULT_GATE_DBFS,
    medianSize: MEDIAN_SIZE,
    filter: PITCH_FILTER,
    inTuneEnterMs: IN_TUNE_ENTER_MS,
    inTuneExitMs: IN_TUNE_EXIT_MS,
    inTuneExitFactor: IN_TUNE_EXIT_FACTOR,
    centsStickiness: CENTS_STICKINESS,
    holdMs: HOLD_MS,
    attackSkipMs: ATTACK_SKIP_MS,
    attackJumpDb: ATTACK_JUMP_DB,
  });
  const rows: Row[] = [];
  for (let timeMs = 50; timeMs < 4000; timeMs += 1000 / fps) {
    const buffer = windowAt(signal, SAMPLE_RATE, timeMs, DEFAULT_BUFFER_SIZE);
    const level = dbfs(rms(buffer));
    const pitch =
      level >= DEFAULT_GATE_DBFS ? detector.detect(buffer) : { frequency: 0, clarity: 0 };
    rows.push({ ...tuner.process({ ...pitch, rmsDbfs: level, timeMs }), timeMs });
  }
  return rows;
}

/** Frames where the screen shows a reading (live or held). */
const visible = (rows: Row[]) => rows.filter((r) => r.status === "note" || r.stale);

function changes<T>(rows: Row[], pick: (r: Row) => T): number {
  let n = 0;
  for (let i = 1; i < rows.length; i++) if (pick(rows[i] as Row) !== pick(rows[i - 1] as Row)) n++;
  return n;
}

const CASES = [
  { cents: 0, noiseDbfs: -58, seed: 1 },
  { cents: 0, noiseDbfs: -52, seed: 2 },
  { cents: 2, noiseDbfs: -58, seed: 3 },
  { cents: -2, noiseDbfs: -52, seed: 4 },
];

describe("reading stability on a modelled plucked string", () => {
  it.each(CASES)("an in-tune string turns green once and stays green: %o", (c) => {
    const shown = visible(play(c));
    expect(shown.length).toBeGreaterThan(120);
    expect(shown.some((r) => r.inTune)).toBe(true);
    // One change: not in tune → in tune. It never drops back while the note is on screen.
    expect(changes(shown, (r) => r.inTune)).toBe(1);
    expect(shown.at(-1)?.inTune).toBe(true);
  });

  it.each(CASES)("the needle holds still once the attack has passed: %o", (c) => {
    const settled = play(c).filter((r) => r.status === "note" && r.timeMs > 700);
    const offsets = settled.map((r) => r.cents - c.cents);
    expect(Math.max(...offsets)).toBeLessThan(3);
    expect(Math.min(...offsets)).toBeGreaterThan(-3);
    const steps = settled.slice(1).map((r, i) => Math.abs(r.cents - (settled[i] as Row).cents));
    expect(Math.max(...steps)).toBeLessThan(1);
    expect(changes(settled, (r) => r.shownCents)).toBeLessThanOrEqual(6);
  });

  it("a string 10 cents sharp is never called in tune", () => {
    const shown = visible(play({ cents: 10, noiseDbfs: -52, seed: 5 }));
    expect(shown.some((r) => r.inTune)).toBe(false);
  });

  it.each([30, 120])("behaves the same at %i frames per second", (fps) => {
    const shown = visible(play({ cents: 0, noiseDbfs: -58, seed: 1 }, fps));
    expect(changes(shown, (r) => r.inTune)).toBe(1);
    const settled = shown.filter((r) => r.status === "note" && r.timeMs > 700);
    expect(Math.max(...settled.map((r) => Math.abs(r.cents)))).toBeLessThan(3);
  });

  it("follows a peg turned up to pitch while the string rings", () => {
    // 30 cents flat, raised to pitch between 0.4 s and 1.4 s.
    const bend = (s: number) => -30 + 30 * Math.min(1, Math.max(0, (s - 0.4) / 1.0));
    const rows = play({ bendCents: bend, attackSharpCents: 0, noiseDbfs: -58, seed: 6 });
    const live = rows.filter((r) => r.status === "note" && r.timeMs > 300 && r.timeMs < 1500);
    const lag = live.map((r) => Math.abs(r.cents - bend(r.timeMs / 1000 - WINDOW_LAG_S)));
    expect(Math.max(...lag)).toBeLessThan(5);
    const greenAt = rows.find((r) => r.inTune)?.timeMs ?? Infinity;
    // The pitch enters the ±5 window at about 1.23 s.
    expect(greenAt).toBeGreaterThan(1200);
    expect(greenAt).toBeLessThan(1600);
    expect(changes(visible(rows), (r) => r.inTune)).toBe(1);
  });
});
