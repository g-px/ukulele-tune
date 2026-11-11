/** Numeric constants from docs/planning/design.md section 6. */
export const BUFFER_SIZES = [2048, 4096] as const;
export type BufferSize = (typeof BUFFER_SIZES)[number];
export const DEFAULT_BUFFER_SIZE: BufferSize = 2048;

export const MIN_FREQ = 100;
export const MAX_FREQ = 1000;
export const HIGHPASS_HZ = 80;
export const LOWPASS_HZ = 3000;

export const CLARITY_THRESHOLD = 0.9;
export const DEFAULT_GATE_DBFS = -55;
export const GATE_MIN_DBFS = -70;
export const GATE_MAX_DBFS = -20;

export const MEDIAN_SIZE = 5;
/** Pitch filter (core/smoothing.ts), tuned on test/helpers/string-sim.ts. */
export const PITCH_FILTER = {
  driftCents: 3,
  noiseFloorCents: 0.5,
  noisePerClarity: 200,
  trendMs: 150,
  trendDeadband: 0.35,
  chase: 8,
} as const;
export const IN_TUNE_ENTER_MS = 100;
export const IN_TUNE_EXIT_MS = 150;
export const IN_TUNE_EXIT_FACTOR = 1.4;
export const CENTS_STICKINESS = 0.3;
export const HOLD_MS = 1000;
export const ATTACK_SKIP_MS = 60;
export const ATTACK_JUMP_DB = 10;

export const A4_MIN = 415;
export const A4_MAX = 466;
export const A4_DEFAULT = 440;

export const NEEDLE_RANGE_CENTS = 50;
/** Needle spring stiffness, rad/s: it settles on a new value in about 0.2 s. */
export const NEEDLE_SPRING = 25;
export const ANNOUNCE_INTERVAL_MS = 1000;

export const CAPTURE_MIN_MS = 300;
export const CAPTURE_TOLERANCE_CENTS = 30;
/** Before capturing string 3: this much silence, or a pitch this far from string 4. */
export const CAPTURE_GAP_MS = 200;
export const CAPTURE_MIN_CHANGE_CENTS = 100;

export const GUIDE_HOLD_MS = 1000;
export const WRONG_WAY_WINDOW_MS = 800;
export const WRONG_WAY_GROW_CENTS = 15;
export const WRONG_WAY_SHOW_MS = 4000;
