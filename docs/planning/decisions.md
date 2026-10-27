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

## Defaults in force until overridden
(see `open-questions.md` for the full list)

- Mobile-first responsive web app, installable PWA, works offline.
- Audio path: `AnalyserNode` polled per animation frame; structured so an `AudioWorklet` can replace it.
- Hosting: GitHub Pages via GitHub Actions; CI runs lint, typecheck, unit tests and a Playwright smoke test on PRs.
- Milestones: M1 math + detector with tests, M2 mic + needle UI, M3 presets/settings/help, M4 PWA + deploy.
- License: MIT (confirm).
