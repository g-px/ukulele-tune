# UI specification (from the design canvas)

Design canvas: https://claude.ai/artifact/313FtAS9NZPtWQ6VagKK7g
Seven phone artboards, 390×844: 1 Start · 2 Tuner (auto, in tune) ·
3 Tuner (manual lock, flat) · 4 Tuner (octave hint, A4 = 442) ·
5 Microphone blocked · 6 Settings · 7 Help.
The implementer builds exactly these screens and states. Values below are
the ones used on the canvas; put them in `src/styles.css` as custom
properties and in `src/ui/needle.ts` as constants.

## Tokens

| Token | Dark (default, as drawn) | Light (derive; keep ≥ 4.5:1 on text) |
|-------|--------------------------|---------------------------------------|
| `--bg` | #141A24 | #F7F8FA |
| `--surface` | #1E2633 | #FFFFFF |
| `--border` | #2B3647 | #D9DEE7 |
| `--text` | #F3F5F8 | #141A24 |
| `--text-2` | #D5DBE5 | #2E3A4B |
| `--muted` | #9AA6B8 | #5B6778 |
| `--accent` | #F5B942 | #8A5D00 |
| `--accent-bg` | #2A2512 | #FFF3D6 |
| `--ok` | #4ADE80 | #15803D |
| `--ok-bg` | #173B2C | #DCFCE7 |
| `--warn` | #FB923C | #C2410C |
| `--warn-bg` | #3B2414 | #FFEDD5 |

Typography: Inter (Google Fonts, self-host the woff2 in `public/fonts` so
the standalone and offline builds do not depend on the network; fall back
to `system-ui, sans-serif`). Tabular numerals on every number.

| Element | Size / weight |
|---------|---------------|
| App title | 18 / 700 |
| Screen title (Settings, Help) | 22 / 800 |
| Note label | 96 / 800, letter-spacing −3px, line-height 1 |
| Cents | 26 / 600 |
| Status pill | 15 / 700 |
| String letter | 30 / 800; octave + Hz line 13 / 600 |
| Body | 14–15 / 400, line-height 1.5 |
| Section label (uppercase) | 13 / 700, letter-spacing 0.6px |

Layout: page padding 20px, vertical gap 12px, max content width 480px
centred on wider screens. Radii: 12px controls, 14px string buttons, 16px
cards, 999px pills. Touch targets ≥ 44px. Light/dark follow
`prefers-color-scheme` unless the Theme setting overrides.

## Screen 1 · Start (`Start.dc.html`)
Centered column: logo (inline SVG), title, one-line instruction, primary
button **Start tuner** (60px, accent background, dark text; this click
creates/resumes the AudioContext and requests the mic), secondary button
**Tune by ear with reference tones** (opens the tuner without the mic;
tones enabled, needle idle), privacy card ("Audio never leaves your device…").

## Screen 2 · Tuner, auto, in tune (`Main.dc.html`)
Top to bottom:
1. Header: logo + "Ukulele Tune"; right: Help and Settings icon links (44px).
2. Tuning `<select>` (48px, surface, border) listing all nine presets as
   "Name · short code". Right of it, **A4 badge** (`A4 = 442`), rendered
   only when A4 ≠ 440; tapping opens Settings.
3. Note display: note label (`G4`), cents (`+1 ¢`, signed, muted colour when
   in tune), status pill: **In tune** (ok colours).
4. Needle (see geometry below), green zone solid, needle and pivot `--ok`.
5. Strings panel: 4-column grid, order 4→1 (G C E A) left→right, mirrored
   when left-handed. Each column: string button 88px (letter, "4 · 392 Hz")
   and a 44px tone button (play icon). Current string: accent border +
   accent-bg + accent text; others surface/border.
6. Mode row: segmented control **Auto | Chromatic** (40px buttons inside a
   4px padded surface pill). Selected = `--border` background.
7. Bottom: mic level bar (6px, accent fill, 0–100%) and status line
   ("Listening… pluck one string near the sound hole.").

## Screen 3 · Tuner, manual lock, flat (`TunerFlat.dc.html`)
Differences from screen 2: note `E4`, cents `−23 ¢` in `--warn`, pill
**Tighten** with an up-arrow icon (warn colours); needle rotated −20.7°
(−23 ¢), needle and pivot `--warn`, "♭ flat" label highlighted; green zone at
35% opacity; E string button in current style **with a lock icon** top-right;
mode row has neither Auto nor Chromatic pressed and shows the text
"Locked: E · tap Auto to unlock" in accent; status line gives the peg advice.
Sharp state is the mirror: pill **Loosen** with down arrow, "sharp ♯" highlighted.

## Screen 4 · Tuner, octave hint (`TunerOctave.dc.html`)
Standard C (high G) selected, A4 badge visible (`A4 = 442`), heard 196 Hz:
note `G4`, cents `−1198 ¢` (unclamped number, needle clamped at −45°),
pill **Tighten**, and a **warning card** under the note display: triangle
icon, "**Sounds an octave low.** Is this a low-G string? Do not tighten a
low-G string up to G4; it can snap." plus a button **Switch to Standard C
(low G)** that changes the tuning. G string button uses `--warn` border and
text. Status line shows "Heard 196 Hz". The card appears whenever
`octaveHint !== "none"` and names the matching preset when one exists
(high G ↔ low G, D ↔ Canadian, baritone ↔ vintage G).

## Screen 5 · Microphone blocked (`MicError.dc.html`)
Header with Help link; card with crossed-mic icon, title **Microphone
blocked**, one-line cause; "How to fix it" ordered list (address-bar
permission, iPhone Settings › Safari › Microphone, in-app browsers,
https/localhost); primary **Try again** (re-requests the mic), secondary
**Tune by ear with reference tones**; footnote about the iPhone ringer
switch. Variants by `MicError`: `denied` (as drawn), `not-found` ("No
microphone found"), `in-use` ("Microphone is used by another app"),
`insecure-context` ("Open this page over https:// or localhost"),
`unsupported` ("This browser cannot capture audio"). Same layout, different
title, cause and list.

## Screen 6 · Settings (`Settings.dc.html`)
Back link + title. Rows separated by 1px `--surface` lines:
Tuning (select) · A4 reference (− / number input / + , 415–466, step 1) ·
In-tune window (±5 | ±3) · Note names (Sharps ♯ | Flats ♭) · Left-handed
(switch) · Theme (System | Light | Dark) · **Advanced**: Analysis window
(2048 | 4096) · Noise gate (range −70…−20 dB, value shown) · **Reset to
defaults** at the bottom. Every change applies immediately and persists.

## Screen 7 · Help (`Help.dc.html`)
Back link + title; four cards: How to tune (4 steps), High G or low G?,
Why does the needle jump?, Microphone not working; footer with lock icon
and the privacy sentence + version. Content scrolls if taller than the
viewport.

## Needle geometry (`src/ui/needle.ts`)
SVG viewBox 0 0 350 200, pivot (175, 190), arc radius 160, stroke 14,
from −45° to +45°. Angle = clamp(cents, −50, 50) × 0.9°. Ticks at −50,
−25, +25, +50 (between r 150 and 170); labels "−50 −25 +25 +50";
"♭ flat" bottom-left, "sharp ♯" bottom-right. Green zone wedge
±(inTuneCents × 0.9°) between r 140 and 170 (as drawn: ±4.5° for ±5 ¢;
recompute the path when the window is ±3). Needle: line from pivot to
r 150, width 4, round caps, inside `<g transform="rotate(angle 175 190)">`;
pivot circle r 9. Colours: `--ok` when inTune, `--warn` when out, `--muted`
when stale/silent. Transition `transform 80ms linear`; none under
`prefers-reduced-motion`.

## Copy (all in `src/strings.ts`)
Exactly the strings visible on the artboards, plus the variants listed
above. Status messages: "Listening… pluck one string near the sound hole.",
"Heard {hz} Hz", "Turn the {string} peg to raise the pitch. Go past the mark
and come back up if it slips.", "Turn the {string} peg to lower the pitch,
then come back up to the mark.", "Playing {note} reference tone".
