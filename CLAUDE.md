# Ukulele Tune — instructions for coding sessions

Read first: `docs/planning/design.md` (what to build, signatures, tests) and
`docs/planning/tasks.md` (what to build next). Domain background is in
`docs/knowledge/`; decisions in `docs/planning/decisions.md`.

## Workflow (trunk-based)
- Work directly on `main`. One task from `tasks.md` per commit (or a few
  small commits per task). Mark the task `[x]` in `tasks.md` in the finishing commit.
- Before every commit run `npm run check` (lint, format, typecheck, unit
  tests, e2e once it exists). Never commit with failing checks. Never skip,
  disable or weaken a test to get green.
- Push to `main` after each completed task. CI must stay green; if it goes
  red, fixing it is the next task.
- Do not add dependencies beyond those named in `design.md` §2 without
  recording the reason in `decisions.md`.

## Code rules
- `src/core/**` is pure TypeScript: no DOM, no Web Audio, no timers, no
  imports from other `src/` folders. Everything there has unit tests.
- Strict TypeScript; no `any`; no non-null assertions except with a comment
  explaining why it is safe.
- Frequencies are never hard-coded in app code; derive from MIDI numbers and
  the A4 setting via `core/pitch-math.ts`.
- Never hard-code the sample rate; use `AudioContext.sampleRate`.
- All user-facing text lives in `src/strings.ts`.
- Keep the production bundle small (target < 100 kB gzipped). No UI framework.
- Match existing formatting (Prettier). Short functions, descriptive names,
  comments only where the reason is not obvious from the code.

## Commands
`npm run dev` · `npm run check` · `npm run build` · `npm run build:standalone` · `npm run e2e`
