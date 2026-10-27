# Pitch, notes and cents: the math the app needs

## Equal temperament

Western tuning divides the octave (a 2:1 frequency ratio) into 12 equal
semitones. Each semitone is a ratio of `2^(1/12) ≈ 1.059463`. The reference is
**A4 = 440 Hz** (ISO 16). Some orchestras use 442 or 443; some players use
432. A tuner should let the user set A4 in the range **415–466 Hz**, default
440, and must show the value whenever it is not 440.

## MIDI note numbers

A4 = 69, C4 (middle C) = 60, each semitone = +1. Octave numbers change at C:
B3 = 59, C4 = 60. (Scientific pitch notation.)

```
f(midi)        = a4 * 2 ** ((midi - 69) / 12)
midiFloat(f)   = 69 + 12 * log2(f / a4)
nearestMidi(f) = round(midiFloat(f))
```

Note name: `["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][midi % 12]`,
octave: `floor(midi / 12) - 1`. Offer flats as a display option
(D♭ instead of C♯); the index math is the same.

## Cents

1 semitone = 100 cents. 1 octave = 1200 cents.

```
cents(f, fRef) = 1200 * log2(f / fRef)
f = fRef * 2 ** (cents / 1200)
```

Cents relative to the nearest semitone: `(midiFloat(f) - nearestMidi(f)) * 100`,
always in (−50, +50].

Cents relative to a **chosen target string** (instrument mode): use the
string's frequency as `fRef`; the result can be large (a very loose string can
read −400 cents) and the UI should clamp the needle at ±50 but print the real
number.

Worked examples (A4 = 440):

| Detected Hz | Nearest note | Cents |
|-------------|--------------|-------|
| 440.00      | A4           | 0     |
| 453.00      | A4           | +50.4 |
| 392.00      | G4           | 0     |
| 389.74      | G4           | −10   |
| 261.63      | C4           | 0     |
| 264.00      | C4           | +15.6 |
| 196.00      | G3           | 0 (one octave, −1200 cents, below G4) |

## Resolution the app can achieve

Perceptual facts:
- A just-noticeable difference in pitch for most listeners is about 5 cents
  for sustained tones; trained ears notice 2–3 cents. Two ukulele strings
  5 cents apart beat noticeably when played together, so ±5 cents is a
  reasonable "in tune" window, ±3 cents a "fine" window.

Numerical facts (sample rate 48 kHz):
- Period of A4 = 48000 / 440 = 109.09 samples. One whole sample of error in
  the period estimate = 1200·log2(110/109) ≈ **16 cents**. So integer-period
  autocorrelation is far too coarse; **parabolic interpolation** of the
  correlation peak (built into YIN and MPM) gets this to well under 1 cent.
- Frequency-domain methods with an FFT of 2048 samples have a bin width of
  48000/2048 = 23.4 Hz, which at 262 Hz is about 150 cents. Plain FFT peak
  picking is useless for a tuner; time-domain methods or very long FFTs with
  interpolation are needed. This is why tuners use autocorrelation-family
  algorithms.
- Analysis window length: the detector needs at least ~2 full periods, better
  3–4. The lowest target (D3, 146.8 Hz, period 6.8 ms) needs ≥ 14–27 ms;
  2048 samples at 48 kHz = 42.7 ms is comfortable. 4096 samples (85 ms) gives
  more stable low-string readings at the cost of latency. Bass ukulele
  (41 Hz, 24 ms period) would need 4096–8192.

## Harmonics and why octave errors happen

A plucked string produces the fundamental f plus harmonics 2f, 3f, …
Autocorrelation peaks appear at the period of f and at every multiple of it
(2/f, 3/f …), and if the 2nd harmonic is strong there is also a peak at 1/(2f).
Detectors can therefore lock onto half or double the true pitch, especially:
- in the first ~50 ms after the pluck (the attack is noisy and harmonic-rich),
- as the note decays and the fundamental dies before higher harmonics on
  thin strings,
- on wound low-G and baritone strings, which have a strong 2nd harmonic.

Mitigations: clarity/confidence threshold, restricting the search range to
the instrument's range (100–1000 Hz), preferring the candidate nearest to the
currently selected string's target, median filtering over the last few frames,
and ignoring frames whose pitch jumps by ≈ an octave from a stable reading.

## Loudness

RMS of the time-domain buffer in dBFS: `20 * log10(rms)`. A silence gate
around −50 to −40 dBFS (tune per device) stops the tuner from reporting
pitches on room noise. Show a simple level meter so users know the mic is live.
