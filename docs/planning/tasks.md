# Task plan

Derived from the design canvas (https://claude.ai/artifact/313FtAS9NZPtWQ6VagKK7g)
and `docs/planning/design.md`. The UI spec that translates the canvas into
tokens, geometry and copy is `docs/planning/ui-spec.md`.

Ordered. Each task is self-contained, ends with `npm run check` green and a
commit on `main`. Do not start a task before the previous one is committed.
Read the referenced sections before coding; follow `CLAUDE.md`.

Status: `[ ]` todo, `[~]` in progress, `[x]` done (tick it in the finishing commit).

## Milestone M1: scaffold, math, detector (no UI)

- [x] **T01 Scaffold.** Vite + TypeScript (design §2, §3): `package.json`
  scripts, strict `tsconfig.json`, `vite.config.ts` (base `./`), placeholder
  `index.html`/`src/main.ts`/`src/styles.css`, ESLint flat config + Prettier,
  Vitest with one trivial test, `.gitignore`, `.githooks/pre-push` running
  `npm run check`, `prepare` script setting `core.hooksPath`. `check` = lint +
  format:check + typecheck + test (e2e added in T17).
  Done: fresh clone → `npm ci && npm run check && npm run build` passes.
- [x] **T02 CI.** `.github/workflows/ci.yml`: Node 20, npm cache, `npm ci`,
  `npm run check`, `npm run build`, on push to `main` and PRs.
  Done: first push green on GitHub.
- [x] **T03 pitch-math.** `src/core/pitch-math.ts` + tests with every value in design §4.1. 100% coverage of the file.
- [ ] **T04 tunings.** `src/core/tunings.ts` with the nine presets from `docs/knowledge/02-tunings.md`; tests per design §4.2 plus a table test of every string's Hz at A4 = 440.
- [ ] **T05 signal helpers and generators.** `src/core/signal.ts` (rms, dbfs) and `test/helpers/signal.ts` (sine, pluck, seeded whiteNoise, mix, addNoiseSnr) with tests (design §4.4, T05 in the old plan).
- [ ] **T06 MPM detector.** `src/core/mpm.ts` per design §4.3 with every listed test, including no-octave-error cases and the performance soft check.
- [ ] **T07 smoothing + string-select.** `src/core/smoothing.ts`, `src/core/string-select.ts` and tests (design §4.5, §4.6). `nearestString` must also return the *partner preset id* for octave hints (high G ↔ low G, D ↔ Canadian, baritone ↔ vintage G) so screen 4's button can switch tunings.
- [ ] **T08 tuner state machine.** `src/core/tuner.ts` + tests (design §4.7) including stale/hold behaviour and the `direction`/`inTune` rules the pills depend on.
  Done: M1 complete, `src/core` coverage ≥ 95%.

## Milestone M2: app shell and tuner screen (artboards 1–5)

- [ ] **T09 Settings, store, config, strings.** `src/state/store.ts`,
  `src/state/settings.ts` (design §7, fields exactly as on artboard 6),
  `src/config.ts` (design §6), `src/strings.ts` with all copy from
  `ui-spec.md`. Unit tests for settings validation/persistence with a fake
  `localStorage`.
- [ ] **T10 Audio layer.** `src/audio/mic.ts` (constraints, filter graph,
  analyser, `classifyMicError` with the five variants used by screen 5) and
  `src/audio/tone.ts` (triangle oscillator, 10 ms attack / 30 ms release).
  Unit-test `classifyMicError`; log `getSettings()` on start.
- [ ] **T11 Theme and app shell.** `src/styles.css` with the token table
  from `ui-spec.md` (dark + light via `prefers-color-scheme` and
  `data-theme`), Inter woff2 in `public/fonts` with `@font-face`,
  `src/ui/dom.ts` (`h`, `on`, `qs`), `src/ui/app.ts` with screen switching
  (`tuner | settings | help`, hidden attribute, no router) and the shared
  header (logo, title, Help/Settings icon buttons as on artboard 2).
  Done: empty screens render in both themes at 360 and 390 px wide with no horizontal scroll.
- [ ] **T12 Start overlay (artboard 1).** `src/ui/start-overlay.ts`: logo,
  title, instruction, **Start tuner** (creates/resumes AudioContext in the
  click handler, requests the mic, hides the overlay on success), **Tune by
  ear with reference tones** (hides overlay, mic stays off, status says
  "Microphone off · tones only"), privacy card.
- [ ] **T13 Needle (artboard 2–4 geometry).** `src/ui/needle.ts` builds the
  SVG per `ui-spec.md` "Needle geometry"; `update({cents, inTune, state})`
  rotates the needle, swaps colours, re-draws the green wedge when the
  window changes; reduced-motion respected. Unit-test the angle and wedge
  path functions (pure, in `src/core/needle-geometry.ts`).
- [ ] **T14 Note display and status pill.** `src/ui/note-display.ts`:
  note label, signed cents with tabular numerals, pill with the three
  variants **In tune / Tighten ↑ / Loosen ↓** and the stale (greyed) look.
- [ ] **T15 Strings panel (artboards 2–4).** `src/ui/strings-panel.ts`:
  4-column grid in 4→1 order, mirrored when left-handed; each column a
  string button (letter, "octave · Hz") and a tone button. States: idle,
  current (accent), locked (accent + lock icon), octave-warning (warn).
  Tapping a string sets manual mode; tapping again or **Auto** clears it.
  Tone button toggles the reference tone and pauses detection while playing.
- [ ] **T16 Tuner screen assembly + main loop (artboards 2, 3, 4).**
  `src/ui/tuner-screen.ts` composes header, tuning select (nine presets),
  A4 badge (only when ≠ 440, links to Settings), note display, needle,
  strings panel, mode row (Auto | Chromatic | "Locked: X" text), octave
  warning card with **Switch to …** button, level bar, status line.
  `src/main.ts` runs the rAF loop: mic read → detector → tuner.process →
  store → UI. `visibilitychange` stops/resumes the mic and resumes the
  context. Done: with a sine from another device the screen shows the
  states of artboards 2, 3 and 4 exactly (verify manually; list what was
  checked in the commit message).
- [ ] **T17 Microphone blocked screen (artboard 5).** `src/ui/mic-error.ts`
  with the five `MicError` variants, **Try again** (re-request) and **Tune
  by ear** actions, ringer footnote.
- [ ] **T18 Playwright smoke test.** `playwright.config.ts`,
  `test/e2e/smoke.spec.ts` with fake media flags: load, click **Start
  tuner**, expect "Listening…" and buttons G C E A; open Settings and Help
  and return. Add `e2e` to `check` and CI (`npx playwright install
  --with-deps chromium`).

## Milestone M3: settings, help, polish (artboards 6–7)

- [ ] **T19 Settings screen (artboard 6).** `src/ui/settings-screen.ts`:
  every row as drawn, immediate effect (A4 updates targets, Hz labels and
  the badge; tuning resets the tuner; left-handed mirrors; theme applies;
  window redraws the wedge; analysis window recreates the detector and
  analyser; gate updates config), **Reset to defaults**.
- [ ] **T20 Help screen (artboard 7).** `src/ui/help-screen.ts` from
  `strings.ts`: the four cards and the privacy footer; scrolls.
- [ ] **T21 Accessibility and UX pass.** `aria-live` region ("G4, 12 cents
  flat, tighten", throttled 1/s, on change only), `aria-pressed` on
  segmented and string buttons, focus order, 44px targets,
  `prefers-reduced-motion`, haptic `navigator.vibrate(30)` on entering
  in-tune, stale reading greys out after 1 s, Lighthouse accessibility ≥ 95.

## Milestone M4: builds, PWA, deploy

- [ ] **T22 Standalone build.** `vite.standalone.config.ts` +
  `vite-plugin-singlefile` → `dist/standalone.html`; fonts inlined;
  service worker registration guarded against `file://`; CI uploads the
  file as an artifact. Verify it opens from disk in Chrome and prompts for the mic.
- [ ] **T23 PWA.** `vite-plugin-pwa`, manifest (name "Ukulele Tune", short
  name "UkeTune", theme colour #141A24, icons 192/512 from the logo), offline
  test: build, preview, load, go offline, reload.
- [ ] **T24 GitHub Pages deploy.** `.github/workflows/deploy.yml` on push to
  `main` with `actions/deploy-pages`; URL in README. Needs Pages source set
  to "GitHub Actions" in repo settings (owner action).
- [ ] **T25 README and docs refresh.** Usage, local run, build targets,
  architecture summary linking `design.md` and `ui-spec.md`; record any
  deviations in `decisions.md`.

## Backlog (not scheduled)
Intonation check, relative-tuning helper, custom tunings UI, N-string
instruments, pt-BR i18n and solfège, AudioWorklet path, strobe display,
real-ukulele WAV fixtures, light-theme design artboards.
