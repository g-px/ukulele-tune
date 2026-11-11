/** Running median over the last `size` values. Removes single-frame outliers. */
export class MedianFilter {
  private readonly values: number[] = [];
  constructor(private readonly size: number) {
    if (size < 1) throw new Error("Median size must be >= 1");
  }
  push(v: number): number {
    this.values.push(v);
    if (this.values.length > this.size) this.values.shift();
    const sorted = [...this.values].sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    return sorted.length % 2
      ? (sorted[mid] as number)
      : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
  }
  reset(): void {
    this.values.length = 0;
  }
}

export interface PitchFilterOptions {
  /** How far the true pitch may wander, in cents per square root of a second. */
  driftCents: number;
  /** Expected error of a perfectly clear frame, cents. */
  noiseFloorCents: number;
  /** Extra expected error per unit of lost clarity (1 − clarity), cents. */
  noisePerClarity: number;
  /** Window over which frames disagreeing the same way count as real movement, ms. */
  trendMs: number;
  /** Movement below this many expected errors is treated as noise. */
  trendDeadband: number;
  /** How hard sustained movement speeds the filter up, per √s. */
  chase: number;
}

const MAX_STEP_MS = 100;

/**
 * One-dimensional Kalman filter over pitch in cents. Each frame is weighted
 * by how clear it was: a ringing string is followed almost at once, the noisy
 * tail of a fading note barely moves the estimate. Frames that keep
 * disagreeing in the same direction (a peg being turned) speed it up again.
 * Time-based, so the result does not depend on the frame rate.
 */
export class PitchFilter {
  private estimate: number | undefined;
  private variance = 0;
  private lastMs = 0;
  private trend = 0;
  private loose = false;
  constructor(private readonly options: PitchFilterOptions) {
    const { driftCents, noiseFloorCents, noisePerClarity, trendMs, trendDeadband, chase } = options;
    const ok =
      driftCents > 0 &&
      noiseFloorCents > 0 &&
      noisePerClarity >= 0 &&
      trendMs > 0 &&
      trendDeadband >= 0 &&
      chase >= 0;
    if (!ok) throw new Error("Invalid pitch filter options");
  }
  push(cents: number, clarity: number, timeMs: number): number {
    const o = this.options;
    const noise = o.noiseFloorCents + o.noisePerClarity * Math.max(0, 1 - clarity);
    const measured = noise * noise;
    if (this.estimate === undefined || this.loose) {
      this.estimate = cents;
      this.variance = measured;
      this.trend = 0;
      this.loose = false;
    } else {
      const dtMs = Math.min(MAX_STEP_MS, Math.max(0, timeMs - this.lastMs));
      const dt = dtMs / 1000;
      const error = cents - this.estimate;
      this.trend += (1 - Math.exp(-dtMs / o.trendMs)) * (error - this.trend);
      const moving = Math.max(0, Math.abs(this.trend) - o.trendDeadband * noise) * o.chase;
      const predicted = this.variance + (o.driftCents * o.driftCents + moving * moving) * dt;
      const gain = predicted / (predicted + measured);
      this.estimate += gain * error;
      this.variance = (1 - gain) * predicted;
    }
    this.lastMs = timeMs;
    return this.estimate;
  }
  /** Forget how sure the estimate is: the next frame is taken as it comes (a new pluck). */
  loosen(): void {
    this.loose = true;
  }
  reset(): void {
    this.estimate = undefined;
    this.variance = 0;
    this.trend = 0;
    this.loose = false;
  }
  get value(): number | undefined {
    return this.estimate;
  }
}

/** Rounds to a whole number but only moves once the value is clearly past the midpoint. */
export class StickyRound {
  private shown: number | undefined;
  constructor(private readonly margin: number) {
    if (!(margin >= 0 && margin < 0.5)) throw new Error("Sticky margin must be in [0, 0.5)");
  }
  push(v: number): number {
    if (this.shown === undefined || Math.abs(v - this.shown) > 0.5 + this.margin) {
      this.shown = Math.round(v);
    }
    return this.shown;
  }
  reset(): void {
    this.shown = undefined;
  }
}
