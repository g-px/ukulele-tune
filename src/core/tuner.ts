/**
 * Pure per-frame tuner logic: gating, smoothing, string matching and the
 * in-tune / hold rules. Input is one detector result per animation frame.
 */
import { centsToNearest, midiToFreq, noteName } from "./pitch-math";
import { MedianFilter, PitchFilter, StickyRound, type PitchFilterOptions } from "./smoothing";
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
  filter: PitchFilterOptions;
  /** In tune once the note has stayed inside the window this long. */
  inTuneEnterMs: number;
  /** In tune ends once the note has stayed outside window × exit factor this long. */
  inTuneExitMs: number;
  inTuneExitFactor: number;
  /** How far past a half the cents must go before the displayed whole number changes. */
  centsStickiness: number;
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
  /** Whole cents for the read-out; steadier than rounding `cents` every frame. */
  shownCents: number;
  direction: Direction;
  /** Latched: needs a steady moment inside the window, and a clear exit to end. */
  inTune: boolean;
  stringNumber: StringNumber | null;
  octaveHint: OctaveHint;
  partnerTuningId?: string;
  /** 0..1 for the level meter (-60..0 dBFS). */
  level: number;
  /** True while a previous reading is held after the signal stopped. */
  stale: boolean;
  /** True on the frame the level jumped by more than attackJumpDb (a new pluck). */
  attack: boolean;
}

export const EMPTY_READING: TunerReading = {
  status: "silent",
  frequency: 0,
  noteLabel: "",
  targetHz: 0,
  cents: 0,
  shownCents: 0,
  direction: "none",
  inTune: false,
  stringNumber: null,
  octaveHint: "none",
  level: 0,
  stale: false,
  attack: false,
};

/** Pitch jumping more than this from the smoothed value starts a new note. */
const JUMP_RESET_CENTS = 50;

const toCents = (hz: number) => 1200 * Math.log2(hz);
const toHz = (cents: number) => 2 ** (cents / 1200);

export function levelFromDbfs(dbfs: number): number {
  if (!Number.isFinite(dbfs)) return 0;
  return Math.min(1, Math.max(0, (dbfs + 60) / 60));
}

export function createTuner(initial: TunerConfig) {
  let config = { ...initial };
  let median = new MedianFilter(config.medianSize);
  let filter = new PitchFilter(config.filter);
  let shown = new StickyRound(config.centsStickiness);
  let inTune = false;
  let insideSince: number | null = null;
  let outsideSince: number | null = null;
  let last: TunerReading | null = null;
  let lastGoodMs = -Infinity;
  let prevDbfs = -Infinity;
  let attackUntil = -Infinity;

  function reset(): void {
    median = new MedianFilter(config.medianSize);
    filter = new PitchFilter(config.filter);
    shown = new StickyRound(config.centsStickiness);
    newNote();
    last = null;
    lastGoodMs = -Infinity;
    prevDbfs = -Infinity;
    attackUntil = -Infinity;
  }

  function newNote(): void {
    filter.reset();
    shown.reset();
    inTune = false;
    insideSince = null;
    outsideSince = null;
  }

  /** Schmitt trigger in time: steady inside the window to enter, clearly outside to leave. */
  function latchInTune(absCents: number, timeMs: number): void {
    if (!inTune) {
      if (absCents > config.inTuneCents) {
        insideSince = null;
        return;
      }
      insideSince ??= timeMs;
      if (timeMs - insideSince >= config.inTuneEnterMs) {
        inTune = true;
        outsideSince = null;
      }
      return;
    }
    if (absCents <= config.inTuneCents * config.inTuneExitFactor) {
      outsideSince = null;
      return;
    }
    outsideSince ??= timeMs;
    if (timeMs - outsideSince >= config.inTuneExitMs) {
      inTune = false;
      insideSince = null;
    }
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
    if (last && timeMs - lastGoodMs < config.holdMs) {
      return { ...last, status, level, stale: true };
    }
    if (last) {
      // The note has gone; start the next one from clean filters.
      last = null;
      median.reset();
      newNote();
    }
    return { ...EMPTY_READING, status, level };
  }

  function process(frame: FrameInput): TunerReading {
    const jump = frame.rmsDbfs - prevDbfs;
    prevDbfs = frame.rmsDbfs;
    const attack = Number.isFinite(jump) && jump > config.attackJumpDb;
    if (attack && config.attackSkipMs > 0) attackUntil = frame.timeMs + config.attackSkipMs;
    if (attack) {
      // A new pluck may land on a different pitch (the peg was turned): re-acquire at once.
      median.reset();
      filter.loosen();
    }
    const reading = read(frame);
    return reading.attack === attack ? reading : { ...reading, attack };
  }

  function read(frame: FrameInput): TunerReading {
    const level = levelFromDbfs(frame.rmsDbfs);

    if (!(frame.rmsDbfs >= config.gateDbfs)) return held("silent", level, frame.timeMs);
    if (frame.frequency <= 0 || frame.clarity < config.clarityThreshold) {
      return held("noisy", level, frame.timeMs);
    }
    if (frame.timeMs < attackUntil) return held("noisy", level, frame.timeMs);

    const med = toCents(median.push(frame.frequency));
    const prev = filter.value;
    if (prev !== undefined && Math.abs(med - prev) > JUMP_RESET_CENTS) newNote();
    const freq = toHz(filter.push(med, frame.clarity, frame.timeMs));

    const m = match(freq);
    latchInTune(Math.abs(m.cents), frame.timeMs);
    const within = inTune || Math.abs(m.cents) <= config.inTuneCents;
    const direction: Direction = within ? "in-tune" : m.cents < 0 ? "flat" : "sharp";

    const reading: TunerReading = {
      status: "note",
      frequency: freq,
      noteLabel: m.noteLabel,
      targetHz: m.targetHz,
      cents: m.cents,
      shownCents: shown.push(m.cents),
      direction,
      inTune,
      stringNumber: m.stringNumber,
      octaveHint: m.octaveHint,
      level,
      stale: false,
      attack: false,
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
