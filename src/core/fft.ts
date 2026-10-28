/** In-place iterative radix-2 complex FFT with precomputed tables. */
export interface Fft {
  readonly size: number;
  /** Forward transform of (re, im) in place. */
  forward(re: Float64Array, im: Float64Array): void;
  /** Inverse transform in place, scaled by 1/size. */
  inverse(re: Float64Array, im: Float64Array): void;
}

export function createFft(size: number): Fft {
  if (size < 2 || (size & (size - 1)) !== 0) throw new Error("FFT size must be a power of two");
  const bits = Math.log2(size);
  const rev = new Uint32Array(size);
  for (let i = 0; i < size; i++) {
    let r = 0;
    for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
    rev[i] = r;
  }
  const cos = new Float64Array(size / 2);
  const sin = new Float64Array(size / 2);
  for (let i = 0; i < size / 2; i++) {
    cos[i] = Math.cos((2 * Math.PI * i) / size);
    sin[i] = Math.sin((2 * Math.PI * i) / size);
  }

  function transform(re: Float64Array, im: Float64Array, sign: 1 | -1): void {
    for (let i = 0; i < size; i++) {
      const j = rev[i] as number;
      if (j > i) {
        const tr = re[i] as number;
        re[i] = re[j] as number;
        re[j] = tr;
        const ti = im[i] as number;
        im[i] = im[j] as number;
        im[j] = ti;
      }
    }
    for (let len = 2; len <= size; len <<= 1) {
      const half = len >> 1;
      const step = size / len;
      for (let start = 0; start < size; start += len) {
        for (let k = 0; k < half; k++) {
          const wr = cos[k * step] as number;
          const wi = -sign * (sin[k * step] as number);
          const a = start + k;
          const b = a + half;
          const br = re[b] as number;
          const bi = im[b] as number;
          const xr = br * wr - bi * wi;
          const xi = br * wi + bi * wr;
          re[b] = (re[a] as number) - xr;
          im[b] = (im[a] as number) - xi;
          re[a] = (re[a] as number) + xr;
          im[a] = (im[a] as number) + xi;
        }
      }
    }
  }

  return {
    size,
    forward: (re, im) => transform(re, im, 1),
    inverse: (re, im) => {
      transform(re, im, -1);
      for (let i = 0; i < size; i++) {
        re[i] = (re[i] as number) / size;
        im[i] = (im[i] as number) / size;
      }
    },
  };
}
