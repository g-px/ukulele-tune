/**
 * Pure per-frame tuner logic: gating, smoothing, string matching and the
 * in-tune / hold rules. Input is one detector result per animation frame.
 */
import { centsBetween, centsToNearest, midiToFreq, noteName } from "./pitch-math";
import { Ema, MedianFilter } from "./smoothing";
import { matchString, nearestString, type OctaveHint } from "./string-select";
import type { StringNumber, Tuning } from "./tunings";

export type TunerMode =
  { kind: "auto" } | { kind: "manual"; stringNumber: StringNumber } | { kind: "chromatic" };

export interface TunerConfig {
  a4: number;
  tuning: Tuning;
  mode: TunerMode;
  flats: boolean;
  inTuneCents: number;
  clarityThreshold: number;
  gateDbfs: number;
  medianSize: number;
  emaAlpha: number;
  inTuneHoldFrames: number;
  holdMs: number;
  /** Ignore this long after the level jumps (pluck attack). 0 disables. */
  attackSkipMs: number;
  attackJumpDb: number;
}

export interface FrameInput {
  frequency: number;
  clarity: number;
  rmsDbfs: number;
  timeMs: number;
}

export type Direction = "flat" | "sharp" | "in-tune" | "none";

export interface TunerReading {
  status: "silent" | "noisy" | "note";
  /** Smoothed Hz; 0 when there is no reading. */
  frequency: number;
  /** Target note in auto/manual mode, nearest note in chromatic mode. */
  noteLabel: string;
  targetHz: number;
  /** Signed and unclamped. */
  cents: number;
  direction: Direction;
  inTune: boolean;
  stringNumber: StringNumber | null;
  octaveHint: OctaveHint;
  partnerTuningId?: string;
  /** 0..1 for the level meter (-60..0 dBFS). */
  level: number;
  /** True while a previous reading is held after the signal stopped. */
  stale: boolean;
}

export const EMPTY_READING: TunerReading = {
  status: "silent",
  frequency: 0,
  noteLabel: "",
  targetHz: 0,
  cents: 0,
  direction: "none",
  inTune: false,
  stringNumber: null,
  octaveHint: "none",
  level: 0,
  stale: false,
};

/** Smoothed pitch jumping more than this resets the EMA (new string plucked). */
const JUMP_RESET_CENTS = 50;

export function levelFromDbfs(dbfs: number): number {
  if (!Number.isFinite(dbfs)) return 0;
  return Math.min(1, Math.max(0, (dbfs + 60) / 60));
}

export function createTuner(initial: TunerConfig) {
  let config = { ...initial };
  let median = new MedianFilter(config.medianSize);
  let ema = new Ema(config.emaAlpha);
  let inTuneCount = 0;
  let last: TunerReading | null = null;
  let lastGoodMs = -Infinity;
  let prevDbfs = -Infinity;
  let attackUntil = -Infinity;

  function reset(): void {
    median = new MedianFilter(config.medianSize);
    ema = new Ema(config.emaAlpha);
    inTuneCount = 0;
    last = null;
    lastGoodMs = -Infinity;
    prevDbfs = -Infinity;
    attackUntil = -Infinity;
  }

  function update(patch: Partial<TunerConfig>): void {
    config = { ...config, ...patch };
    reset();
  }

  function match(freq: number) {
    const { a4, tuning, mode, flats } = config;
    if (mode.kind === "chromatic") {
      const { midi, cents } = centsToNearest(freq, a4);
      return {
        noteLabel: noteName(midi, flats).label,
        targetHz: midiToFreq(midi, a4),
        cents,
        stringNumber: null,
        octaveHint: "none" as OctaveHint,
        partnerTuningId: undefined,
      };
    }
    let m;
    if (mode.kind === "manual") {
      const chosen = tuning.strings.find((s) => s.number === mode.stringNumber);
      m = chosen ? matchString(freq, chosen, a4) : nearestString(freq, tuning, a4);
    } else {
      m = nearestString(freq, tuning, a4);
    }
    return {
      noteLabel: noteName(m.string.midi, flats).label,
      targetHz: m.targetHz,
      cents: m.cents,
      stringNumber: m.string.number,
      octaveHint: m.octaveHint,
      partnerTuningId: m.partnerTuningId,
    };
  }

  function held(status: "silent" | "noisy", level: number, timeMs: number): TunerReading {
    inTuneCount = 0;
    if (last && timeMs - lastGoodMs < config.holdMs) {
      return { ...last, status, level, inTune: false, stale: true };
    }
    if (last) {
      // The note has gone; start the next one from clean filters.
      last = null;
      median.reset();
      ema.reset();
    }
    return { ...EMPTY_READING, status, level };
  }

  function process(frame: FrameInput): TunerReading {
    const level = levelFromDbfs(frame.rmsDbfs);
    const jump = frame.rmsDbfs - prevDbfs;
    prevDbfs = frame.rmsDbfs;
    if (config.attackSkipMs > 0 && jump > config.attackJumpDb && Number.isFinite(jump)) {
      attackUntil = frame.timeMs + config.attackSkipMs;
    }

    if (!(frame.rmsDbfs >= config.gateDbfs)) return held("silent", level, frame.timeMs);
    if (frame.frequency <= 0 || frame.clarity < config.clarityThreshold) {
      return held("noisy", level, frame.timeMs);
    }
    if (frame.timeMs < attackUntil) return held("noisy", level, frame.timeMs);

    const med = median.push(frame.frequency);
    const prev = ema.value;
    if (prev !== undefined && Math.abs(centsBetween(med, prev)) > JUMP_RESET_CENTS) ema.reset();
    const freq = ema.push(med);

    const m = match(freq);
    const within = Math.abs(m.cents) <= config.inTuneCents;
    inTuneCount = within ? inTuneCount + 1 : 0;
    const direction: Direction = within ? "in-tune" : m.cents < 0 ? "flat" : "sharp";

    const reading: TunerReading = {
      status: "note",
      frequency: freq,
      noteLabel: m.noteLabel,
      targetHz: m.targetHz,
      cents: m.cents,
      direction,
      inTune: inTuneCount >= config.inTuneHoldFrames,
      stringNumber: m.stringNumber,
      octaveHint: m.octaveHint,
      level,
      stale: false,
    };
    if (m.partnerTuningId) reading.partnerTuningId = m.partnerTuningId;
    last = reading;
    lastGoodMs = frame.timeMs;
    return reading;
  }

  return {
    process,
    update,
    reset,
    get config(): Readonly<TunerConfig> {
      return config;
    },
  };
}

export type Tuner = ReturnType<typeof createTuner>;
