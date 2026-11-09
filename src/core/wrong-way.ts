/**
 * Notice when the user is turning a peg the wrong way: within one sustained
 * note, the distance from the target keeps growing (decision 18).
 */
export interface WrongWayOptions {
  windowMs: number;
  growCents: number;
}

export interface WrongWayFrame {
  cents: number;
  noteActive: boolean;
  inTune: boolean;
  attack: boolean;
  timeMs: number;
}

export interface WrongWayDetector {
  push(f: WrongWayFrame): boolean;
  reset(): void;
}

/** Allowed dip in |cents| between samples before the trend counts as broken. */
const NOISE_CENTS = 3;

export function createWrongWayDetector(o: WrongWayOptions): WrongWayDetector {
  let samples: Array<{ t: number; off: number }> = [];

  return {
    push(f) {
      if (!f.noteActive || f.inTune || f.attack) {
        samples = [];
        return false;
      }
      samples.push({ t: f.timeMs, off: Math.abs(f.cents) });
      samples = samples.filter((p) => f.timeMs - p.t <= o.windowMs);
      let min = Infinity;
      let peak = -Infinity;
      for (const p of samples) {
        if (p.off < peak - NOISE_CENTS) return false;
        peak = Math.max(peak, p.off);
        min = Math.min(min, p.off);
      }
      const newest = samples[samples.length - 1]?.off ?? 0;
      return newest - min >= o.growCents;
    },
    reset() {
      samples = [];
    },
  };
}
