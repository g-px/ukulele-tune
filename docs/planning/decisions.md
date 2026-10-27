# Decisions

Recorded as they are made. Each entry: decision, date, reason.

| # | Decision | Date | Notes |
|---|----------|------|-------|
| 1 | **Stack: TypeScript + Vite, no UI framework.** | 2026-10-27 | Smallest bundle; logic in plain modules that are easy to unit-test. |
| 2 | **V1 scope: microphone tuner + reference tones + all 9 tuning presets** from `docs/knowledge/02-tunings.md`, instrument mode with auto string detection, chromatic toggle, adjustable A4. | 2026-10-27 | Presets are data; the engine is the same for all. |
| 3 | **Pitch detection implemented in-repo** (McLeod Pitch Method with parabolic interpolation and clarity), unit-tested against synthetic signals; `pitchy` only as a dev-time comparison. | 2026-10-27 | No runtime dependency; control over range limits and octave handling. |
| 4 | **UI language: English only.** Note names as letters (G C E A). | 2026-10-27 | Solfège / pt-BR not in v1; keep strings in one place so i18n can be added later. |

## Defaults in force until overridden
(see `open-questions.md` for the full list)

- Mobile-first responsive web app, installable PWA, works offline.
- Audio path: `AnalyserNode` polled per animation frame; structured so an `AudioWorklet` can replace it.
- Hosting: GitHub Pages via GitHub Actions; CI runs lint, typecheck, unit tests and a Playwright smoke test on PRs.
- Work on branches + pull requests into `main`.
- Milestones: M1 math + detector with tests, M2 mic + needle UI, M3 presets/settings/help, M4 PWA + deploy.
- License: MIT (confirm).
