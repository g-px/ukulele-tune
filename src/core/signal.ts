/** Root-mean-square level of a buffer. */
export function rms(buffer: Float32Array): number {
  if (buffer.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    const v = buffer[i] as number;
    sum += v * v;
  }
  return Math.sqrt(sum / buffer.length);
}

/** Level in dB relative to full scale; -Infinity for silence. */
export function dbfs(rmsValue: number): number {
  return rmsValue > 0 ? 20 * Math.log10(rmsValue) : -Infinity;
}

/** Largest absolute sample value; exactly 0 means the input is digital silence. */
export function peak(buffer: Float32Array): number {
  let max = 0;
  for (let i = 0; i < buffer.length; i++) {
    const v = Math.abs(buffer[i] as number);
    if (v > max) max = v;
  }
  return max;
}
