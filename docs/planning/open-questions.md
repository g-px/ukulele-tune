# Open questions before implementation

Answered items are marked **[decided]** and recorded in `decisions.md`.

Answers to these decide the stack, scope and first milestone. Where a default
is given, that is what will be built if there is no answer.

## A. Product and audience
1. **Who is it for?** Beginners tuning a standard uke, or also players who
   switch tunings and care about ±1 cent? *Default: beginners first, presets
   for the rest.*
2. **Primary device:** phone in the browser (likely), desktop, or both? Should
   it be installable offline as a PWA? *Default: mobile-first responsive web
   app, installable PWA.*
3. **[decided: English only]** **UI language:** Portuguese (pt-BR), English, or both with a switch?
   Should note names offer solfège (Dó Ré Mi) as an option? *Default: pt-BR
   and en, letter names with a solfège toggle.*
4. **Name / branding / visual style** for the app (colours, dark mode, logo)?
   *Default: working name "Ukulele Tune", light and dark themes, no logo.*

## B. Scope of version 1
5. **[decided: both]** **Microphone tuner only**, or also **reference tones** for tuning by ear
   in v1? *Default: both; tones are cheap and cover mic-denied cases.*
6. **[decided: all nine presets]** **Which tunings in v1?** Just Standard C high G, or also low G and
   baritone, or the full list of nine presets in `02-tunings.md`?
   *Default: all nine; the engine does not care and it is just data.*
7. **[decided: yes]** **Chromatic mode** (name any note) in addition to instrument/string mode?
   *Default: yes, as a toggle.*
8. **[decided: yes]** **Adjustable A4 reference** (415–466 Hz)? *Default: yes, in settings.*
9. Anything beyond tuning now or later: chord library, metronome, intonation
   check, relative-tuning helper, custom user tunings, N-string instruments
   (guitalele)? *Default: none in v1; data model leaves room for custom
   tunings and N strings.*

## C. Technical choices
10. **[decided: TypeScript + Vite, no framework]** **Stack:** plain TypeScript + Vite (no framework), or React / Svelte /
    Vue? Any preference for a CSS approach (plain CSS, Tailwind)? *Default:
    TypeScript + Vite + Svelte or vanilla, plain CSS; small bundle matters.*
11. **[decided: in-repo MPM]** **Pitch detection:** use `pitchy` (McLeod Pitch Method, MIT) or implement
    YIN/MPM in-repo with no dependency? *Default: in-repo MPM with a test
    suite, pitchy as the comparison baseline during development.*
12. **Audio path:** `AnalyserNode` polled per animation frame (simpler) or an
    `AudioWorklet` (more robust, more code)? *Default: AnalyserNode for v1,
    designed so the worklet can replace it.*
13. **Browser support floor:** is iOS Safari 14.5+ / Chrome 90+ acceptable?
    Any need for older Android WebViews?
14. **Hosting and deploy:** GitHub Pages from this repo, Vercel, Netlify,
    your own domain? Should CI (GitHub Actions) run lint, unit tests and a
    Playwright smoke test on every PR? *Default: GitHub Pages via Actions,
    CI on PRs.*
15. **Testing expectations:** unit tests for the math and detector with
    synthetic signals only, or also real recordings of a ukulele as fixtures?
    Can you record the four open strings on your own uke and phone?
16. **License** for the repo (MIT? something else?) and whether third-party
    code (pitchy) is acceptable.

## D. Process
17. Should work go straight to `main` or via branches and pull requests?
18. Do you want a milestone split (M1 math + detector with tests, M2 mic +
    needle UI, M3 presets/settings/help, M4 PWA + deploy), or one shot?
19. Is there anything in the knowledge files (`docs/knowledge/`) that
    disagrees with how you tune or what you want the app to say?
