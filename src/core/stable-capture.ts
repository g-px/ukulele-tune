/** Capture one plucked string's pitch: the median of a run of readings that agree. */
import { centsBetween } from "./pitch-math";

export interface StableCaptureOptions {
  minMs: number;
  toleranceCents: number;
}

export interface StableCapture {
  /** `frequency` 0 means no pitch this frame. Returns the median Hz once stable, else null. */
  push(frequency: number, timeMs: number): number | null;
  reset(): void;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  const hi = sorted[mid] ?? 0;
  return sorted.length % 2 ? hi : ((sorted[mid - 1] ?? hi) + hi) / 2;
}

export function createStableCapture(opts: StableCaptureOptions): StableCapture {
  let run: number[] = [];
  let startMs = 0;
  let captured = false;

  return {
    push(frequency, timeMs) {
      if (captured) return null;
      if (!(frequency > 0)) {
        run = [];
        return null;
      }
      if (run.length > 0 && Math.abs(centsBetween(frequency, median(run))) > opts.toleranceCents) {
        run = [];
      }
      if (run.length === 0) startMs = timeMs;
      run.push(frequency);
      if (timeMs - startMs < opts.minMs) return null;
      captured = true;
      return median(run);
    },
    reset() {
      run = [];
      captured = false;
    },
  };
}
