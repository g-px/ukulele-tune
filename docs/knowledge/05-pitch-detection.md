# Pitch detection for a tuner

## Candidate algorithms

| Algorithm | Idea | Pros | Cons | Verdict |
|-----------|------|------|------|---------|
| Zero crossing | count sign changes | trivial | useless with harmonics | no |
| FFT peak | biggest spectral bin | easy to visualise | 100+ cent resolution unless huge FFT; picks harmonics | no (maybe as a spectrum visual) |
| Autocorrelation (ACF) | correlate signal with delayed copy, pick first strong peak | robust, simple, no library | octave errors with strong harmonics; needs interpolation | acceptable baseline |
| **YIN** (de Cheveigné & Kawahara, 2002) | squared-difference function, cumulative-mean normalisation, absolute threshold (~0.1–0.15), parabolic interpolation | de facto standard for monophonic pitch; good accuracy/speed; threshold gives confidence | occasional wild values (pitchfinder's author notes this) | strong candidate |
| **MPM / McLeod Pitch Method** (McLeod & Wyvill, 2005, "A Smarter Way to Find Pitch") | normalised square difference function, key-maximum picking, returns pitch **and clarity** (0–1) | explicitly designed for real-time tuners; clarity is a built-in noise gate; good on low notes | slightly heavier than YIN | **recommended** |
| pYIN / CREPE / SWIPE | probabilistic / neural | best accuracy on hard material | too heavy for a browser tuner; unnecessary for monophonic clean plucks | no |

A plucked ukulele string is a clean monophonic signal with a strong
fundamental; YIN or MPM on a 2048–4096 sample window gives sub-cent precision.

## Libraries (JavaScript)

| Library | Algorithm | Notes |
|---------|-----------|-------|
| **pitchy** (ianprime0509, MIT, ESM-only) | MPM | Built for tuners. `PitchDetector.forFloat32Array(inputLength)`, then `detector.findPitch(buffer, sampleRate)` → `[pitchHz, clarity]`. Options: `clarityThreshold` (0–1, recommended 0.8–1; below threshold clarity is reported and the result should be ignored), `minVolumeDecibels` / `minVolumeAbsolute` (volume gate → clarity 0). Input length must equal the detector's `inputLength`. |
| pitchfinder (peterkhayes, MIT) | YIN, AMDF, ACF2+, Dynamic Wavelet, MPM | grab-bag; author recommends YIN; works on `Float32Array`. |
| @chordbook/tuner | wraps pitchy | reference config: `clarityThreshold: 0.9`, buffer 8192, band-limit 27.5–4186 Hz. Useful as a design reference, not a dependency. |
| pitchlite / sevagh pitch-detection | YIN & MPM in C++ → WASM | overkill here. |

Writing our own YIN or MPM is ~100 lines and avoids a dependency; using
pitchy is the quicker path and its MPM is well tested. Either is fine; the
decision is listed in `docs/planning/open-questions.md`.

## Processing pipeline (proposed)

```
mic (getUserMedia, processing off)
  → MediaStreamAudioSourceNode
  → BiquadFilter highpass ~80 Hz  (kills 50/60 Hz hum and handling noise)
  → BiquadFilter lowpass ~2–3 kHz (optional; tames attack noise)
  → AnalyserNode (fftSize 2048 or 4096) polled every animation frame
      getFloatTimeDomainData(buf)
  → RMS gate (skip frame if < −45 dBFS, tunable)
  → detector.findPitch(buf, ctx.sampleRate) → [hz, clarity]
  → reject if clarity < 0.9 or hz outside 100–1000 Hz
  → median of last 5 accepted readings (removes single-frame glitches)
  → nearest target string (auto) or selected string (manual)
  → cents = 1200·log2(hz / target)
  → UI: note, octave, cents, direction, in-tune flag (|cents| ≤ 5 for N consecutive frames)
```

Alternative: an `AudioWorkletProcessor` that accumulates 128-sample blocks
into a ring buffer and runs the detector off the main thread, posting results
to the page. More accurate timing and no dependence on `requestAnimationFrame`
(which pauses in background tabs), at the cost of a separate module file and
more plumbing. For a tuner that is only used in the foreground, the
AnalyserNode approach is sufficient and simpler; see `06-web-audio-platform.md`.

## Parameters and their trade-offs

| Parameter | Suggested | Effect |
|-----------|-----------|--------|
| `fftSize` / window | 2048 (42.7 ms @ 48 kHz); 4096 if low strings jitter | longer = steadier low notes, slower response |
| Poll rate | every rAF (~60 Hz), windows overlap | smooth needle; cost is one MPM per frame, cheap |
| Clarity threshold | 0.9 (range 0.8–0.95) | higher = fewer false notes, needs cleaner signal |
| Volume gate | −45 dBFS (device dependent) | stops readings on room noise |
| Pitch range | 100–1000 Hz | rejects hum, speech harmonics, octave errors |
| Smoothing | median of 5, then EMA α≈0.3 for the needle | median kills outliers; EMA makes motion readable |
| In-tune window | ±5 cents (option ±3 "precise") | matches hardware tuners |
| In-tune hold | ≥ 3 consecutive in-window frames (~50 ms) | avoids flashing green on the way through |
| Attack skip | ignore ~60 ms after level jumps > 10 dB | attack transient gives wrong pitch |

## Known failure modes to test for

- **Octave errors** on low G and baritone D (strong 2nd harmonic). Test with
  recordings; compare YIN vs MPM.
- **Decay**: as the note fades the fundamental may drop below the gate while
  harmonics remain; expect the reading to disappear, not jump an octave.
- **Two strings ringing** (sloppy pluck): detector returns garbage or the
  louder string; clarity usually drops. Advise "pluck one string".
- **Browser audio processing on**: AGC pumps the level; noise suppression
  treats a sustained tone as noise and attenuates it; echo cancellation can
  cancel the reference tone the app itself is playing. All three must be off.
- **Speaker→mic feedback** when playing the reference tone and listening at
  the same time: mute the mic path or pause detection while the tone plays.
- **Device clock error**: phones' audio clocks are accurate to well under a
  cent; ignore unless measured otherwise (Peterson claims up to ±3 cents on
  some devices and offers calibration; a manual A4 offset covers this).

## Test material

Generate synthetic test signals (sine, sawtooth with decaying harmonics,
plus noise) for unit tests of the detector at every target frequency and at
±5, ±20, ±50 cents, and record real plucks of each string on a real uke
(phone mic, laptop mic) for integration tests. Keep recordings as small WAV
files under `test/fixtures/`.
