# Decisions

Recorded as they are made. Each entry: decision, date, reason.

| # | Decision | Date | Notes |
|---|----------|------|-------|
| 1 | **Stack: TypeScript + Vite, no UI framework.** | 2026-10-27 | Smallest bundle; logic in plain modules that are easy to unit-test. |
| 2 | **V1 scope: microphone tuner + reference tones + all 9 tuning presets** from `docs/knowledge/02-tunings.md`, instrument mode with auto string detection, chromatic toggle, adjustable A4. | 2026-10-27 | Presets are data; the engine is the same for all. |
| 3 | **Pitch detection implemented in-repo** (McLeod Pitch Method with parabolic interpolation and clarity), unit-tested against synthetic signals; `pitchy` only as a dev-time comparison. | 2026-10-27 | No runtime dependency; control over range limits and octave handling. |
| 4 | **UI language: English only.** Note names as letters (G C E A). | 2026-10-27 | Solfège / pt-BR not in v1; keep strings in one place so i18n can be added later. |
| 5 | **Static build, runs locally.** `vite build` emits a static SPA in `dist/` (index.html + JS + CSS, no server logic). Two ways to run it: serve `dist/` with any static file server on `localhost` (full features, including PWA), or open the single-file build `dist/standalone.html` directly from disk. | 2026-10-27 | See "Build and run" below for the `file://` caveats. |
| 6 | **Trunk-based development.** Commit directly to `main`. A commit is allowed only when lint, typecheck and the full test suite pass locally (enforced by a pre-push hook) and CI on `main` re-runs the same checks. No feature branches or pull requests unless a change is explicitly experimental. | 2026-10-27 | The `plan/knowledge-base` branch is merged into `main` and deleted. |

## Build and run

- `npm run dev`: Vite dev server on `http://localhost:5173`. `localhost` counts as a secure context, so the microphone works.
- `npm run build`: static output in `dist/`. Serve it with anything (`npx serve dist`, `python3 -m http.server -d dist`) or deploy to any static host.
- `npm run build:standalone` (planned, via `vite-plugin-singlefile`): inlines all JS and CSS into one `dist/standalone.html` that opens by double-click. Caveats of `file://`:
  - ES module scripts fail on `file://` because of CORS, which is why the standalone build inlines everything.
  - Chrome and Firefox treat `file://` as a secure context and allow `getUserMedia` (they still prompt). Safari is less reliable; use the localhost server there.
  - Service workers, and therefore PWA install/offline, do not work on `file://`. Offline for the standalone file is trivial anyway: it is one file.
  - The AnalyserNode audio path needs no extra module file, which is another reason it was chosen over `AudioWorklet` for v1 (worklet modules must be fetched over HTTP).

| 7 | **Implementation is handed to a cheaper model.** Planning (this doc set) was done with a larger model; `design.md`, `tasks.md` and `CLAUDE.md` are written so a smaller model can implement task by task without re-deriving decisions. | 2026-10-28 | Keep tasks small and testable; expected values are spelled out in `design.md`. |

| 8 | **Visual design fixed on a design canvas** (seven phone artboards, dark theme, amber accent, Inter). `ui-spec.md` is the written form; the task plan maps each UI task to an artboard. | 2026-10-28 | Light theme tokens derived in `ui-spec.md`, not drawn. |

| 9 | **MPM autocorrelation computed with an in-repo radix-2 FFT** (`src/core/fft.ts`), not the direct O(n·lag) sum. | 2026-10-28 | Direct sum measured 7.6 ms per 2048-sample frame under coverage; FFT version 0.22 ms uninstrumented, same accuracy. |

| 10 | **Accessibility gate is axe-core in Playwright** (`@axe-core/playwright`, WCAG 2.0–2.2 A/AA tags) on every screen in dark and light themes, instead of Lighthouse. | 2026-10-28 | Runs in CI with the other e2e tests. It led to darkening the light-theme accent to #8A5D00 and using the visible text as the string buttons' accessible name. |

| 11 | **Implementation deviations from design.md**: Vite 8, Vitest 5, TypeScript 5.9 (TypeScript 7 is outside typescript-eslint's supported range); view logic lives in pure `src/state/derive.ts`; `nearestString` prefers an exact octave match when no string is within 100 cents (prevents reading a high-G string on a low-G tuning as "A, 200 cents flat"); tuner adds a 60 ms attack skip; octave-warning state uses a compact layout to fit 390×844. | 2026-10-28 | All covered by tests. |
| 12 | **License MIT; hosting GitHub Pages via Actions** (also serves `standalone.html`). | 2026-10-28 | Pages must be enabled once in repository settings. |
| 13 | **Mic path hardening after a "no sound detected" report.** The analyser now feeds a zero-gain node into `ctx.destination` (WebKit reads silence from an analyser that does not reach the destination); the mic stream is requested before the AudioContext is created or resumed (iOS can give silence to a context made before capture); the context is resumed when iOS interrupts it; default noise gate lowered from −45 to −55 dBFS because raw mics with auto-gain off are quieter than assumed. | 2026-10-28 | The 0.9 clarity threshold still rejects noise below the gate. Saved settings keep their old gate. |
| 14 | **Dead-mic fallback and diagnostics** after iPhone Safari still showed a flat level bar. When the analyser reads exact zeros for about 1.5 s the engine restarts capture with plain `{audio: true}` constraints and a fresh AudioContext; if that is also silent the status line says so. The context is created at the mic track's sample rate, `navigator.audioSession.type` is set to `play-and-record` where it exists, and `?debug` in the URL shows context, track and level state. Help shows the build commit. | 2026-10-28 | Raw (no processing) capture stays the first choice for accuracy. |
| 15 | **Beginner setup flow (M5).** First launch (skippable) and on demand: how to hold it and string numbers, size (only baritone changes the tuning), look at string 4 (thin = high G, thick/wound = low G), a listen check, result with string map, then guided tuning. Owner chose quiz + listen + visual orientation, first launch + on demand. | 2026-11-09 | Spec `beginner-setup.md`, artboards 8–15. |
| 16 | **High G vs low G is decided by the interval between strings 4 and 3**, not by absolute pitch: ≥ +2 semitones = re-entrant, ≤ −2 = linear, else ask to pluck again. Robust to detuning and to the A4 setting. Listening beats the visual answer; a mismatch is shown, not hidden. Baritone vs low G by absolute bands only when the size is unknown. | 2026-11-09 | `core/identify.ts`. |
| 17 | **English + Brazilian Portuguese.** Locale files typed against the English one, `S` as a live module binding, language from Settings or the browser, reload on change. Letters on the tuner; solfège added in pt-BR guidance text. | 2026-11-09 | Supersedes the "English only" scope from the v1 questions. |
| 18 | **Guided tuning with a wrong-way hint.** Strings 4→1, twice round, advance after 1 s in tune. The hint fires when the deviation grows ≥ 15 cents within 800 ms of one sustained note; peg direction is never assumed (layouts vary). | 2026-11-09 | `core/guide.ts`, `core/wrong-way.ts`. |
| 19 | **M5 implementation notes.** Setup and listen logic live in `src/state/setup.ts` and `src/state/listen.ts` (pure, tested); the mic can start "in place" for the listen step without leaving the wizard; Reset to defaults keeps language, onboarded and ukulele size; tuning names are localized through `tuningName(id)`; strings are never captured at module level because the locale is set before mount. Bundle 28 kB gzipped JS. | 2026-11-10 | E2E feeds WAV sequences (string 4, gap, string 3) and a pitch glide to the fake mic. |
| 20 | **Steady reading (T40).** The frame-count EMA is replaced by a one-dimensional Kalman filter over pitch in cents whose measurement error comes from the detector's clarity (measured on the string model: about 1 cent of error at clarity 0.99, 5 at 0.95, 10 at 0.90), so the noisy tail of a fading note no longer moves the needle; sustained disagreement in one direction (a peg being turned) speeds it up, and a new pluck re-acquires at once. In tune is a latch with hysteresis in level and time and survives the 1 s hold. The cents read-out only changes once the value is clearly past the midpoint. The needle is drawn through a critically damped spring instead of a CSS transition. The needle is not snapped to the centre: it shows the measured offset, steadied. | 2026-11-11 | Tuned on a model of a plucked string (`test/helpers/string-sim.ts`), not on recordings; a real-ukulele fixture is still in the backlog. Trade-off: in a noisy room the needle takes up to about 0.3 s longer to follow a turned peg. |

## Defaults in force until overridden
(see `open-questions.md` for the full list)

- Mobile-first responsive web app, installable PWA, works offline.
- Audio path: `AnalyserNode` polled per animation frame; structured so an `AudioWorklet` can replace it.
- Hosting: GitHub Pages via GitHub Actions; CI runs lint, typecheck, unit tests and a Playwright smoke test on PRs.
- Milestones: M1 math + detector with tests, M2 mic + needle UI, M3 presets/settings/help, M4 PWA + deploy.
