# Ukulele Tune

A ukulele tuner that runs entirely in your browser. Pluck a string, and the
app tells you which string it hears, how many cents it is off, and whether to
tighten or loosen the peg. Audio never leaves your device.

**Live app:** https://g-px.github.io/ukulele-tune/

## Features

- **Beginner setup** on first launch (and any time from Start, Settings or
  Help): how to hold the ukulele and which string is which, its size, whether
  string 4 is thin or thick, then a quick listen to strings 4 and 3. The app
  picks high G, low G or baritone, shows a map of the strings and saves the
  tuning.
- **Guided tuning**: strings 4 to 1, twice round, moving on once each string
  holds in tune, with a "turn the other way" hint when the note drifts away
  from the target.
- **English and Brazilian Portuguese**, chosen from the browser or in
  Settings; solfège (Dó Ré Mi) alongside letters in Portuguese guidance.
- Microphone tuner using the McLeod pitch method, accurate to well under one cent.
- Auto string detection, tap a string to lock onto it, or chromatic mode for any note.
- Warns when a string sounds an octave off (the classic high-G / low-G mix-up)
  and offers to switch to the matching tuning.
- Reference tones for every string, for tuning by ear or when the mic is blocked.
- Nine tunings: Standard C high G and low G, Baritone, D (high and low A),
  Slack-key, B♭, Half-step down, Vintage G.
- Adjustable A4 (415–466 Hz), ±5 or ±3 cent in-tune window, sharps or flats,
  left-handed layout, light and dark themes.
- Installable PWA that works offline, plus a single-file `standalone.html`
  you can open straight from disk.

## Run it locally

Requires Node 20 or newer.

```sh
npm install
npm run dev          # http://localhost:5173 with hot reload
```

The microphone only works on `https://` pages or `localhost`.

### Build targets

```sh
npm run build              # static site in dist/ (index.html, assets, service worker)
npm run preview            # serve dist/ on http://localhost:4173
npm run build:standalone   # dist/standalone.html: everything inlined in one file
```

- `dist/` can be served by any static file server or host.
- `dist/standalone.html` opens by double-click in Chrome, Edge or Firefox,
  which allow the microphone on `file://` pages. Safari is less reliable
  there; use `npm run preview` instead. Offline install features need the
  served version.

## Development

Trunk-based: commit to `main` only when every check passes. A pre-push hook
runs the full check automatically.

```sh
npm run check   # lint + format + typecheck + unit tests (coverage) + e2e
npm test        # unit tests with coverage
npm run e2e     # Playwright end-to-end tests
```

The end-to-end tests feed generated WAV files to Chromium as a fake
microphone, so the whole audio path (mic, filters, detector, tuner, UI) is
tested, along with axe-core accessibility audits, offline support and the
standalone file.

### Architecture

```
src/core/    pure TypeScript: pitch maths, tunings, FFT, McLeod detector,
             smoothing, string selection, tuner state machine, dial geometry,
             tuning identification, stable capture, guided tuning, wrong-way hint
src/state/   store, persisted settings, app state, setup wizard, locale,
             pure view-model functions
src/i18n/    copy: en.ts (reference) and pt-BR.ts, typed against it
src/audio/   AudioContext, microphone graph, reference tones, error mapping
src/ui/      DOM components for each screen (no framework)
src/engine.ts  per-frame loop: mic → detector → tuner → store
```

`src/core` and `src/state` have no DOM or Web Audio dependencies and are
fully unit-tested. Details:

- [Technical design](docs/planning/design.md)
- [UI specification](docs/planning/ui-spec.md), from the [design canvas](https://claude.ai/artifact/313FtAS9NZPtWQ6VagKK7g)
- [Beginner setup, guided tuning and pt-BR](docs/planning/beginner-setup.md)
- [Task plan](docs/planning/tasks.md) and [decisions](docs/planning/decisions.md)
- [Knowledge base](docs/knowledge/): ukulele background, every tuning with
  frequencies, tuning technique, pitch maths, pitch detection, Web Audio
  platform notes, tuner UX, helping beginners (with a pt-BR glossary), sources.

## Deploy

`.github/workflows/deploy.yml` publishes `dist/` (including
`standalone.html`) to GitHub Pages on every push to `main`. It needs Pages
enabled once: repository **Settings › Pages › Build and deployment ›
Source: GitHub Actions**.

## Privacy

All audio analysis happens on your device. The app makes no network
requests after it has loaded and has no analytics.

## Credits and license

MIT licensed, see [LICENSE](LICENSE). The Inter typeface is by Rasmus
Andersson, under the SIL Open Font License, bundled via
`@fontsource-variable/inter`.
