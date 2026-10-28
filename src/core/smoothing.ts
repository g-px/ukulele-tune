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

/** Exponential moving average; first value passes through. */
export class Ema {
  private current: number | undefined;
  constructor(private readonly alpha: number) {
    if (!(alpha > 0 && alpha <= 1)) throw new Error("EMA alpha must be in (0, 1]");
  }
  push(v: number): number {
    this.current = this.current === undefined ? v : this.current + this.alpha * (v - this.current);
    return this.current;
  }
  reset(): void {
    this.current = undefined;
  }
  get value(): number | undefined {
    return this.current;
  }
}
