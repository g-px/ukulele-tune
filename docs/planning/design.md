# Technical design

Target reader: the model or person implementing the app. Everything here is
decided; do not re-open choices without updating `decisions.md`. Background
for every rule lives in `docs/knowledge/`.

## 1. Goals and non-goals

Goals (v1):
- Tune a ukulele with the device microphone, in the browser, on phones and desktops.
- Nine tuning presets (`docs/knowledge/02-tunings.md`), instrument mode with
  auto string detection, manual string lock, chromatic mode.
- Reference tones per string for tuning by ear.
- Adjustable A4 (415–466 Hz), in-tune window (±5 default, ±3 "precise"),
  sharps/flats, left-handed layout.
- Static build: `dist/` for any static host, and a single `standalone.html`.
- Installable PWA with offline support (when served over HTTP(S)).
- No backend, no analytics, no network calls at runtime.

Non-goals (v1): chord library, metronome, intonation check, custom tunings
UI, i18n (English only, but all user-facing strings live in one file).

## 2. Stack and tooling

| Concern | Choice | Notes |
|---------|--------|-------|
| Language | TypeScript 5, `strict: true`, `noUncheckedIndexedAccess: true` | ES2020 target |
| Build | Vite 5 | `vite build` → `dist/`; `vite-plugin-singlefile` for `standalone.html` via a second config `vite.standalone.config.ts` |
| PWA | `vite-plugin-pwa` | `registerType: 'autoUpdate'`, precache app shell; skipped in standalone config |
| UI | no framework; hand-written DOM; SVG for the needle | one tiny `h()` element helper in `src/ui/dom.ts` |
| Styling | one `src/styles.css`, CSS custom properties, `prefers-color-scheme` | mobile-first, max content width 480 px |
| Unit tests | Vitest | all `src/core/**` must be covered; `src/audio/**` is thin and tested via Playwright |
| E2E | Playwright (Chromium) | one smoke test: page loads, Start button appears, settings open; uses `--use-fake-device-for-media-stream` flags |
| Lint/format | ESLint (typescript-eslint, flat config) + Prettier | `npm run lint`, `npm run format:check` |
| Git hooks | `core.hooksPath=.githooks`, set by `npm run prepare` | `.githooks/pre-push` runs `npm run check` |
| CI | GitHub Actions `.github/workflows/ci.yml` | on push to `main` and PRs: `npm ci && npm run check && npm run build && npm run build:standalone`; separate `deploy.yml` publishes `dist/` to GitHub Pages on `main` |

`npm run check` = `lint` + `format:check` + `typecheck` + `test` + `e2e`.

Scripts in `package.json`:

```
dev, build, build:standalone, preview, typecheck, lint, format, format:check,
test, test:watch, e2e, check, prepare
```

## 3. Repository layout

```
.
├── index.html
├── package.json, tsconfig.json, vite.config.ts, vite.standalone.config.ts
├── eslint.config.js, .prettierrc, playwright.config.ts, vitest.config.ts
├── .githooks/pre-push
├── .github/workflows/{ci.yml,deploy.yml}
├── public/            icons, manifest assets
├── src/
│   ├── main.ts                 bootstrap: create store, mount UI, wire audio
│   ├── styles.css
│   ├── strings.ts              all user-facing text (English)
│   ├── config.ts               numeric constants (section 6)
│   ├── core/                   PURE, no DOM, no Web Audio; 100% unit-tested
│   │   ├── pitch-math.ts
│   │   ├── tunings.ts
│   │   ├── mpm.ts              McLeod pitch detector
│   │   ├── signal.ts           rms, dbfs, highpass helper for tests
│   │   ├── smoothing.ts        median, EMA, in-tune hold
│   │   ├── string-select.ts    nearest string, octave hint
│   │   └── tuner.ts            frame → TunerReading state machine
│   ├── audio/                  Web Audio glue, minimal logic
│   │   ├── mic.ts
│   │   └── tone.ts
│   ├── state/
│   │   ├── store.ts            tiny observable store
│   │   └── settings.ts         Settings type, defaults, localStorage persistence
│   └── ui/
│       ├── dom.ts              h(), on(), qs()
│       ├── app.ts              layout, screen switching
│       ├── tuner-screen.ts
│       ├── needle.ts           SVG arc + needle, cents label
│       ├── strings-panel.ts    headstock with 4 string buttons
│       ├── settings-screen.ts
│       └── help-screen.ts
├── test/
│   ├── helpers/signal.ts       synthetic signal generators
│   ├── core/*.test.ts
│   └── e2e/smoke.spec.ts
└── docs/
```

Rule: `src/core` imports nothing from `src/audio`, `src/ui`, `src/state`.

## 4. Core modules: signatures and behaviour

### 4.1 `core/pitch-math.ts`

```ts
export const DEFAULT_A4 = 440;
export function midiToFreq(midi: number, a4 = DEFAULT_A4): number;      // a4 * 2^((midi-69)/12)
export function freqToMidi(freq: number, a4 = DEFAULT_A4): number;      // 69 + 12*log2(freq/a4), fractional
export function nearestMidi(freq: number, a4 = DEFAULT_A4): number;     // Math.round(freqToMidi)
export function centsBetween(freq: number, refFreq: number): number;    // 1200*log2(freq/refFreq)
export function centsToNearest(freq: number, a4 = DEFAULT_A4): { midi: number; cents: number }; // cents in (-50, 50]
export type NoteName = { letter: string; octave: number; label: string }; // label e.g. "G#4" or "Ab4"
export function noteName(midi: number, flats = false): NoteName;        // octave = floor(midi/12)-1
export const SHARP_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
export const FLAT_NAMES  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
```

Expected values (tests): midiToFreq(69)=440; midiToFreq(60)=261.6256 (±0.001);
midiToFreq(55)=196.00; midiToFreq(50)=146.83; freqToMidi(880)=81;
centsBetween(453,440)=50.4 (±0.1); centsToNearest(389.74) → {67, −10 ±0.05};
noteName(60) → "C4"; noteName(59) → "B3"; noteName(61,true) → "Db4";
midiToFreq(69, 432)=432.

### 4.2 `core/tunings.ts`

```ts
export type UkeSize = "soprano" | "concert" | "tenor" | "baritone";
export interface TuningString { number: 1|2|3|4; midi: number }   // number 4 = closest to chin
export interface Tuning {
  id: string; name: string; short: string;        // short e.g. "gCEA" (lowercase = re-entrant high string)
  reentrant: boolean; sizes: UkeSize[]; description: string;
  strings: TuningString[];                         // ordered 4,3,2,1
}
export const TUNINGS: readonly Tuning[];           // the 9 presets, ids:
// "c-high-g","c-low-g","baritone","d-high-a","d-low-a","slack-key","bb","half-step-down","vintage-g"
export const DEFAULT_TUNING_ID = "c-high-g";
export function getTuning(id: string): Tuning;     // throws on unknown id
export function stringFrequency(s: TuningString, a4: number): number;
export function tuningRange(t: Tuning, a4: number): { min: number; max: number }; // lowest/highest target Hz
```

Midi numbers per preset are in `docs/knowledge/02-tunings.md` (copy exactly).
Slack-key uses high G4 for string 4. Test: every preset has 4 strings,
unique ids, strings ordered 4→1, "c-high-g" is G4 C4 E4 A4 = 67,60,64,69,
baritone = 50,55,59,64.

### 4.3 `core/mpm.ts` — McLeod Pitch Method

```ts
export interface PitchDetectorOptions {
  sampleRate: number;
  bufferSize: number;          // e.g. 2048 or 4096
  minFrequency: number;        // e.g. 100
  maxFrequency: number;        // e.g. 1000
  keyMaximumRatio?: number;    // k, default 0.93
}
export interface PitchResult { frequency: number; clarity: number } // frequency 0 when none
export interface PitchDetector { detect(buffer: Float32Array): PitchResult; readonly options: Required<PitchDetectorOptions> }
export function createPitchDetector(opts: PitchDetectorOptions): PitchDetector;
```

Algorithm (McLeod & Wyvill 2005), restricted to the lag range implied by
min/max frequency so the O(n·τ) loop stays cheap (~0.9 M multiply-adds per
2048-sample frame at 48 kHz, 100–1000 Hz):

1. `tauMin = floor(sampleRate / maxFrequency)`, `tauMax = ceil(sampleRate / minFrequency)`; clamp `tauMax ≤ bufferSize/2`. Reject buffer lengths ≠ `bufferSize`.
2. For each lag τ in `[tauMin-1 .. tauMax+1]` (one extra on each side for interpolation) compute
   `acf(τ) = Σ_{j=0}^{W-τ-1} x[j]·x[j+τ]` and
   `m(τ) = Σ_{j=0}^{W-τ-1} (x[j]² + x[j+τ]²)`,
   then `nsdf(τ) = 2·acf(τ) / m(τ)` (0 if `m(τ)` is 0). Values lie in [−1, 1].
   Implementation note: compute `m(τ)` incrementally from the total energy to
   avoid a second inner loop, or compute both in the same loop; either is fine
   as long as tests pass and a 2048 frame runs in < 2 ms in Node.
3. Key maxima: walk τ from the first positive-going zero crossing of nsdf. For
   each run where nsdf > 0, record the index of the maximum value in that run
   (a "key maximum"). Stop at the end of the lag range.
4. If no key maxima: return `{frequency: 0, clarity: 0}`.
5. `threshold = k · max(keyMaxima values)`. Pick the **first** key maximum
   whose value ≥ threshold.
6. Parabolic interpolation around that τ using nsdf(τ−1), nsdf(τ), nsdf(τ+1)
   to get fractional lag `τ*` and interpolated peak value `v*`
   (`clarity = clamp(v*, 0, 1)`).
7. `frequency = sampleRate / τ*`. If outside [minFrequency, maxFrequency]
   return `{0, 0}`.

Volume gating is NOT inside the detector; `core/tuner.ts` does it from RMS.

Tests (sampleRate 48000, bufferSize 2048, 100–1000 Hz, all with
`test/helpers/signal.ts`):
- Pure sine at each of 146.83, 196, 246.94, 261.63, 293.66, 329.63, 369.99, 392, 440, 493.88 Hz (amplitude 0.5): |cents error| < 1, clarity > 0.97.
- Sine at target ±5 and ±20 cents: error < 1 cent.
- "Pluck" signal (fundamental + harmonics 2..6 with amplitudes 1, 0.6, 0.4, 0.25, 0.15, 0.1, slight decay): error < 2 cents, clarity > 0.9, **no octave error** (freq within 100 cents of the fundamental, not 2f or f/2).
- Pluck with strong 2nd harmonic (0.9) at 196 Hz and 146.83 Hz: no octave error.
- White noise (amplitude 0.3): clarity < 0.6.
- Silence (all zeros): `{0, 0}`, no NaN.
- Sine at 60 Hz (below range) and 1500 Hz (above): frequency 0.
- Sine with added noise at SNR 20 dB, 262 Hz: error < 3 cents.
- Performance: 100 detections of 2048 samples in < 300 ms in Node (soft check, log only).

### 4.4 `core/signal.ts`

```ts
export function rms(buffer: Float32Array): number;
export function dbfs(rmsValue: number): number;     // 20*log10(rms), -Infinity for 0
```

### 4.5 `core/smoothing.ts`

```ts
export class MedianFilter { constructor(size: number); push(v: number): number; reset(): void }
export class Ema { constructor(alpha: number); push(v: number): number; reset(): void; get value(): number | undefined }
```

Tests: median of window 5 with one outlier returns the stable value; EMA
converges; reset clears.

### 4.6 `core/string-select.ts`

```ts
export interface StringMatch { string: TuningString; targetHz: number; cents: number; octaveHint: "none" | "octave-low" | "octave-high" }
export function nearestString(freq: number, tuning: Tuning, a4: number): StringMatch;
// nearest by |cents|; octaveHint set when |cents| > 600 and the pitch is within 100 cents of target/2 or target*2.
export function matchString(freq: number, s: TuningString, a4: number): StringMatch; // for manual lock
```

Tests: 392 Hz in c-high-g → string 4, 0 cents; 196 Hz in c-high-g → string 4,
cents ≈ −1200, octaveHint "octave-low"; 330 Hz → string 2, +1.9 cents;
in baritone 196 Hz → string 3.

### 4.7 `core/tuner.ts` — frame state machine (pure)

```ts
export type TunerMode = { kind: "auto" } | { kind: "manual"; stringNumber: 1|2|3|4 } | { kind: "chromatic" };
export interface TunerConfig {
  a4: number; tuning: Tuning; mode: TunerMode;
  inTuneCents: number;          // 5 or 3
  clarityThreshold: number;     // 0.9
  gateDbfs: number;             // -45
  medianSize: number;           // 5
  emaAlpha: number;             // 0.3
  inTuneHoldFrames: number;     // 3
  holdMs: number;               // 1000: keep last reading visible after signal stops
}
export interface FrameInput { frequency: number; clarity: number; rmsDbfs: number; timeMs: number }
export interface TunerReading {
  status: "silent" | "noisy" | "note";
  frequency: number;            // smoothed Hz (0 when not "note")
  noteLabel: string;            // "G4" (nearest note in chromatic; target string note in auto/manual)
  targetHz: number;
  cents: number;                // signed, unclamped
  direction: "flat" | "sharp" | "in-tune";
  inTune: boolean;              // stable for inTuneHoldFrames
  stringNumber: 1|2|3|4|null;
  octaveHint: "none" | "octave-low" | "octave-high";
  level: number;                // 0..1 for the meter, from rmsDbfs mapped -60..0
  stale: boolean;               // true while showing a held reading after the signal stopped
}
export function createTuner(config: TunerConfig): {
  process(frame: FrameInput): TunerReading;
  update(config: Partial<TunerConfig>): void;   // resets filters when tuning/mode/a4 change
  reset(): void;
};
```

Rules:
- `rmsDbfs < gateDbfs` → status "silent" (but keep returning the previous
  note reading with `stale: true` until `holdMs` elapsed since last good frame).
- clarity < threshold or frequency 0 → "noisy" (same hold behaviour).
- Otherwise push frequency through median then EMA; compute match per mode:
  auto → `nearestString`; manual → `matchString`; chromatic → `centsToNearest`.
- direction: "in-tune" if |cents| ≤ inTuneCents else flat (cents < 0) or sharp.
- `inTune` true only after `inTuneHoldFrames` consecutive in-window frames.
- Changing mode/tuning/a4 resets filters and the hold counter.

Tests: feed 20 frames at 392 Hz → inTune true from frame 3 (after median
warm-up), direction "in-tune", string 4; one outlier frame at 784 Hz among
392 Hz frames does not change the reading; frames below gate → "silent",
stale reading kept for < holdMs then cleared; manual lock on string 2 with
262 Hz input → cents ≈ −400, direction flat; chromatic 262 → "C4".

## 5. Audio layer

### 5.1 `audio/mic.ts`

```ts
export interface MicOptions { bufferSize: number; highpassHz: number; lowpassHz: number }
export interface MicSession {
  readonly sampleRate: number;
  readonly settings: MediaTrackSettings;        // what the browser actually gave us (log it)
  read(target: Float32Array): void;             // analyser.getFloatTimeDomainData
  stop(): void;                                 // stops tracks, disconnects nodes
}
export async function startMic(ctx: AudioContext, opts: MicOptions): Promise<MicSession>;
export type MicError = "denied" | "not-found" | "in-use" | "insecure-context" | "unsupported" | "unknown";
export function classifyMicError(e: unknown): MicError;
```

Graph: `MediaStreamSource → Biquad highpass (Q 0.7) → Biquad lowpass → Analyser(fftSize = bufferSize, smoothingTimeConstant 0)`.
Constraints: `{ echoCancellation:false, noiseSuppression:false, autoGainControl:false }`.
The AudioContext is created in `main.ts` inside the Start button click handler;
`ctx.resume()` is called again on `visibilitychange` → visible and on every
Start press. `main.ts` runs a `requestAnimationFrame` loop: `read(buf)` →
`detector.detect(buf)` → `tuner.process({...})` → store.

### 5.2 `audio/tone.ts`

```ts
export interface TonePlayer { play(freq: number): void; stop(): void; readonly playing: boolean }
export function createTonePlayer(ctx: AudioContext, opts?: { type?: OscillatorType; gain?: number }): TonePlayer;
```

Oscillator (triangle) → Gain with 10 ms attack and 30 ms release → destination.
While a tone plays, `main.ts` pauses pitch processing (reading set to "silent").

## 6. Constants (`src/config.ts`)

| Name | Value |
|------|-------|
| BUFFER_SIZE | 2048 (settings "advanced": 4096) |
| MIN_FREQ / MAX_FREQ | 100 / 1000 |
| HIGHPASS_HZ / LOWPASS_HZ | 80 / 3000 |
| CLARITY_THRESHOLD | 0.9 |
| GATE_DBFS | −45 |
| MEDIAN_SIZE | 5 |
| EMA_ALPHA | 0.3 |
| IN_TUNE_CENTS (normal/precise) | 5 / 3 |
| IN_TUNE_HOLD_FRAMES | 3 |
| HOLD_MS | 1000 |
| A4_MIN / A4_MAX / A4_DEFAULT | 415 / 466 / 440 |
| NEEDLE_RANGE_CENTS | ±50 (display clamp) |

## 7. State and settings

```ts
export interface Settings {
  tuningId: string; a4: number; inTuneCents: 3|5; flats: boolean;
  leftHanded: boolean; theme: "system"|"light"|"dark"; bufferSize: 2048|4096;
  gateDbfs: number;
}
```
Persisted to `localStorage` key `ukulele-tune.settings.v1` with try/catch and
validation (fall back to defaults on bad data).

`store.ts`: `createStore<T>(initial)` with `get()`, `set(patch)`, `subscribe(fn)`.
App state: `{ screen: "tuner"|"settings"|"help", micState: "idle"|"starting"|"running"|"error", micError?: MicError, mode: TunerMode, reading: TunerReading, tonePlaying: 1|2|3|4|null, settings }`.

## 8. UI

Single column, max width 480 px, centered. Screens switch by toggling
`hidden`; no router, no URL state.

Tuner screen, top to bottom:
1. Header: app name, settings (gear) and help (?) buttons.
2. Tuning selector (`<select>`), shows name + short code; A4 badge "A4 = 442" visible only when ≠ 440.
3. Note display: big label (e.g. "G4"), below it signed cents ("−12 ¢") and the word **tighten** / **loosen** / **in tune**. Octave hint line when set: "Sounds an octave low. Is this a low-G string?".
4. Needle: SVG arc, ticks at −50, −25, 0, +25, +50; needle rotates ±45° for ±50 cents (clamped); green zone ±inTuneCents; needle colour green when inTune. Needle angle is animated with CSS transition 80 ms.
5. Strings panel: four large buttons in a headstock-like layout, order G C E A left→right (mirrored when leftHanded). Each shows note label with octave; highlighted when it is the current string; tapping locks manual mode (tap again or "Auto" to unlock). Each has a small ♪ button to play its reference tone (toggle).
6. Mode row: Auto | Chromatic toggles.
7. Mic level bar (0–1) and status text ("Listening…", "Pluck one string", "Microphone blocked: …").
8. Start overlay (before the mic runs): one big "Start tuner" button (this is the user gesture). Error state shows cause + fix text from `strings.ts` and the hint that tones still work.

Settings screen: fields for every `Settings` member, "Reset to defaults".
Help screen: static content generated from `strings.ts` sections: how to tune,
high G vs low G, why the needle jumps, microphone troubleshooting, privacy.

Accessibility: `aria-live="polite"` region announcing "G4, 12 cents flat,
tighten", throttled to once per second and only on change; all buttons have
labels; colour never the only cue.

## 9. PWA and builds

- `vite.config.ts`: base `./` (relative asset paths so GitHub Pages subpath and `file://` both work), `VitePWA` with manifest (name, short_name "UkeTune", icons 192/512, display standalone, theme colour).
- `vite.standalone.config.ts`: same but `viteSingleFile()` and no PWA plugin; output `dist/standalone.html` (set `build.rollupOptions.input` and `emptyOutDir: false`).
- Service worker must not be registered on `file://` (guard on `location.protocol`).

## 10. Acceptance criteria for v1

- `npm run check` passes; CI green on `main`.
- Unit coverage of `src/core` ≥ 95% lines.
- On Chrome desktop with a fake audio device the smoke test passes; manual test on Android Chrome and iOS Safari: tuner reads all four strings of a real ukulele with stable readings within ±1 cent of a reference tuner.
- `dist/standalone.html` opens from disk in Chrome and tunes.
- Lighthouse PWA installable; works offline after first load when served over HTTP.
