# Task plan

Ordered. Each task is self-contained, small enough for one focused session,
and ends with `npm run check` passing and a commit on `main`. Do not start a
task before the previous one is committed. Read `design.md` section numbers
referenced in each task before coding. Conventions in `CLAUDE.md`.

Status legend: `[ ]` todo, `[~]` in progress, `[x]` done (update this file in
the same commit that finishes a task).

## Milestone M1: scaffold, math, detector

- [ ] **T01 Scaffold.** Vite + TypeScript project (design §2, §3). Create
  `package.json` scripts, `tsconfig.json` (strict, noUncheckedIndexedAccess),
  `vite.config.ts` (base `./`), `index.html` with "Ukulele Tune" placeholder,
  `src/main.ts`, `src/styles.css`, ESLint flat config + Prettier, Vitest config
  with one trivial test, `.gitignore` (node_modules, dist, playwright-report,
  test-results). `npm run dev`, `build`, `lint`, `format:check`, `typecheck`,
  `test` all work. Add `.githooks/pre-push` running `npm run check` and the
  `prepare` script setting `core.hooksPath`. For now `check` = lint +
  format:check + typecheck + test (e2e added in T12).
  Done when: fresh clone → `npm ci && npm run check && npm run build` passes.

- [ ] **T02 CI.** `.github/workflows/ci.yml`: Node 20, `npm ci`, `npm run
  check`, `npm run build`, on push to `main` and on pull requests. Cache npm.
  Done when: workflow file lints (actionlint not required; YAML valid) and the
  first push is green on GitHub.

- [ ] **T03 pitch-math.** Implement `src/core/pitch-math.ts` (design §4.1) and
  `test/core/pitch-math.test.ts` with every expected value listed there.
  Done when: tests pass, 100% line coverage of the file.

- [ ] **T04 tunings.** Implement `src/core/tunings.ts` (design §4.2) with all
  nine presets copied from `docs/knowledge/02-tunings.md`; tests from §4.2
  plus a table test asserting the Hz of every string of every preset at
  A4=440 against the knowledge file (two decimals).

- [ ] **T05 signal helpers and test generators.** `src/core/signal.ts` (§4.4)
  and `test/helpers/signal.ts` with: `sine(freq, sampleRate, n, amp, phase)`,
  `pluck(freq, sampleRate, n, harmonics: number[], decayPerSecond)`,
  `whiteNoise(n, amp, seed)` (seeded PRNG, deterministic), `mix(...buffers)`,
  `addNoiseSnr(buffer, snrDb, seed)`. Tests: rms of a 0.5 sine ≈ 0.3536,
  dbfs(1)=0, generators produce the requested length and no NaN.

- [ ] **T06 MPM detector.** `src/core/mpm.ts` per design §4.3, with every
  test listed there in `test/core/mpm.test.ts`. Include the performance soft
  check (log time, assert < 300 ms for 100 frames to catch gross regressions).
  Done when: all listed signals detect within tolerance and no octave errors.

- [ ] **T07 smoothing + string-select.** `src/core/smoothing.ts` (§4.5) and
  `src/core/string-select.ts` (§4.6) with their tests.

- [ ] **T08 tuner state machine.** `src/core/tuner.ts` (§4.7) and tests,
  including the hold/stale behaviour driven by `timeMs`.
  Done when: M1 complete; `src/core` coverage ≥ 95%.

## Milestone M2: microphone and tuner screen

- [ ] **T09 settings and store.** `src/state/store.ts`, `src/state/settings.ts`
  (§7), `src/config.ts` (§6), `src/strings.ts` with all copy for the tuner
  screen. Unit tests for settings validation/persistence using a fake
  `localStorage`.

- [ ] **T10 audio layer.** `src/audio/mic.ts` and `src/audio/tone.ts` (§5).
  No unit tests (thin wrappers), but `classifyMicError` is pure: test it.
  Log `track.getSettings()` to console on start.

- [ ] **T11 tuner screen.** `src/ui/dom.ts`, `app.ts`, `tuner-screen.ts`,
  `needle.ts`, `strings-panel.ts` and the `main.ts` loop (§8 items 1–8 except
  settings/help buttons can be stubs). Start overlay creates/resumes the
  AudioContext in the click handler. Auto/manual/chromatic modes work;
  reference tones work and pause detection. Mobile layout verified in
  Chrome device mode at 360×640 and 390×844.
  Done when: tuning a real or simulated signal shows the correct note, cents
  and direction; manual check against a sine from another device or online
  tone generator reads within ±1 cent.

- [ ] **T12 Playwright smoke test.** `playwright.config.ts`, `test/e2e/smoke.spec.ts`:
  launch Chromium with `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream`,
  open the app via `vite preview`, click Start, expect status "Listening…"
  and the strings panel with G4 C4 E4 A4. Add `e2e` to `npm run check` and CI
  (install browsers with `npx playwright install --with-deps chromium`).

## Milestone M3: settings, help, polish

- [ ] **T13 settings screen.** `src/ui/settings-screen.ts`: every field in
  `Settings`, immediate effect (A4 change updates targets and the badge;
  tuning change resets the tuner; left-handed mirrors the strings panel;
  theme applies). "Reset to defaults".

- [ ] **T14 help screen.** `src/ui/help-screen.ts` from `strings.ts` sections
  written from `docs/knowledge/03-tuning-technique.md` and `01-ukulele.md`
  (keep each section under 120 words). Mic troubleshooting text covers:
  HTTPS/localhost, permission denied, iOS tap to start, in-app browsers.

- [ ] **T15 accessibility and UX pass.** `aria-live` announcements (throttled),
  focus order, 44 px touch targets, reduced-motion respects
  `prefers-reduced-motion`, in-tune haptic via `navigator.vibrate(30)` when
  available. Hold-last-reading behaviour visible (greyed).

## Milestone M4: builds, PWA, deploy

- [ ] **T16 standalone build.** `vite.standalone.config.ts` with
  `vite-plugin-singlefile` → `dist/standalone.html`; script `build:standalone`;
  CI builds it and uploads it as an artifact. Service worker registration
  guarded against `file://`. Verify the file opens from disk in Chrome and the
  mic prompt appears.

- [ ] **T17 PWA.** `vite-plugin-pwa`, manifest, icons in `public/`, offline
  test: build, preview, load, go offline, reload → still works.

- [ ] **T18 GitHub Pages deploy.** `.github/workflows/deploy.yml` on push to
  `main`: build and publish `dist/` with `actions/deploy-pages`. Add the URL
  to README. Requires Pages enabled with source "GitHub Actions" in repo
  settings (owner action; note it in README if not yet enabled).

- [ ] **T19 README and docs refresh.** Replace "Status: planning" with usage,
  local run instructions, build targets, and a short architecture section
  linking `docs/planning/design.md`. Record any deviations in `decisions.md`.

## Backlog (not scheduled)

- Intonation check (open vs 12th fret), relative-tuning helper, custom
  tunings UI, N-string instruments (guitalele), pt-BR i18n and solfège,
  AudioWorklet audio path, strobe display, WAV fixtures from a real ukulele.
