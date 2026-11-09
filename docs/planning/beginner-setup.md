# Beginner setup, guided tuning and pt-BR (milestone M5)

Design canvas: https://claude.ai/artifact/313FtAS9NZPtWQ6VagKK7g, row 2,
artboards 8–15. Background facts: `docs/knowledge/08-beginners.md`.
Decisions 15–18 in `decisions.md`. Tasks T28–T38 in `tasks.md`.

The v1 rules still apply (`CLAUDE.md`, `design.md`, `ui-spec.md` tokens).
Everything below is additive; no v1 behaviour changes unless stated.

## 1. Goal

A first-time player opens the app with a ukulele they cannot name. In about
a minute the app:

1. shows how to hold it and which string is which (string 4 = closest to the face);
2. asks two picture questions: size (only baritone changes the tuning) and
   whether string 4 is thinner or thicker than string 3 (high G vs low G);
3. listens to strings 4 and 3 and confirms high G vs low G from which one
   sounds higher (works when the uke is out of tune);
4. shows the result with a string map, saves the tuning;
5. tunes the four strings with them one at a time, twice round, and warns
   when they turn a peg the wrong way.

Shown automatically on first launch (skippable) and available on demand.
The whole app is available in English and Brazilian Portuguese.

## 2. Flow and entry points

```
first launch ─► 8 Start (first launch) ─┬─ Set up my ukulele ─► 9 Hold ─► 10 Size ─► 11 Look ─► 12 Listen ─► 13 Result ─┬─ Tune it with me ─► 14 Guided tuning ─► done card ─► normal tuner
                                        ├─ I know my tuning ─► mic start ─► tuner (onboarded = true)                       └─ Pick the tuning myself ─► 6 Settings
                                        └─ Tune by ear ─► tones-only tuner (onboarded = true)
```

- Size = Baritone skips 11 (baritone has no high/low-G choice) but still runs 12 as a check.
- 12 is skippable ("Skip" in the header): the result then uses the answers only.
- Skip on 9–11 leaves the wizard: sets `onboarded = true`, goes to the start screen's
  normal flow (start the mic tuner). Back on 9 returns to 8.
- On-demand entry points (all open screen 9 with fresh answers):
  - Start screen when `onboarded` is true: text link "New to the ukulele? Set up my ukulele" under the two v1 buttons.
  - Settings, under the Tuning select: link "Not sure? Find my ukulele".
  - Help, first card "Which ukulele do I have?" with a button "Set up my ukulele".
- Leaving guided tuning (× in its header) returns to the normal tuner, mode auto.

## 3. State and settings

### Settings (`src/state/settings.ts`)

New fields, persisted under the same key `ukulele-tune.settings.v1`:

| Field | Type | Default | Sanitize |
|-------|------|---------|----------|
| `language` | `"auto" \| "en" \| "pt-BR"` | `"auto"` | unknown → `"auto"` |
| `onboarded` | `boolean` | `false` | missing key **and** other stored settings present → `true` (returning v1 users do not see the first-launch screen); missing with nothing stored → `false` |
| `ukuleleSize` | `UkeSize` (§4.1) | `"unknown"` | unknown → `"unknown"` |

Tests: the three migration cases for `onboarded`; round-trip of each new field; invalid values.

### App state (`src/state/app-state.ts`)

- `Screen` gains `"setup"`. Guided tuning is the `"tuner"` screen with `guide !== null`.
- `setup: SetupState | null` (§4.6), `guide: GuideState | null` (§4.4),
  `wrongWay: boolean` (hint visible).
- `Actions` gains: `openSetup()`, `setupAnswer(patch)`, `setupNext()`, `setupBack()`,
  `setupSkip()`, `setupListenStart()`, `setupListenRestart()`, `setupFinish(mode: "guide" | "settings")`,
  `guideSkipString()`, `guideExit()`, `setLanguage(lang)`.

## 4. Pure modules (all in `src/core/` or `src/state/`, no DOM, unit-tested)

### 4.1 `src/core/identify.ts`

```ts
export type UkeSize = "soprano" | "concert" | "tenor" | "baritone" | "unknown";
export type GLook = "thin" | "thick" | "unknown";
export interface ListenSample { string4Hz: number; string3Hz: number }
export type ListenVerdict = "reentrant" | "linear" | "unclear";
export type Basis = "listen" | "look" | "size" | "default";
export type Conflict = "none" | "look-vs-listen" | "size-vs-listen";
export interface Identification {
  tuningId: "c-high-g" | "c-low-g" | "baritone";
  basis: Basis;
  conflict: Conflict;
}

/** Semitones from string 3 to string 4: 12·log2(s4/s3). */
export function stringInterval(s: ListenSample): number;
/** ≥ +2 → reentrant, ≤ −2 → linear, otherwise unclear (same string twice, or a wild detune). */
export function listenVerdict(s: ListenSample): ListenVerdict;
/** Only used when the size is unknown: string4Hz < 170 && string3Hz < 226. */
export function soundsBaritone(s: ListenSample): boolean;
export function identify(size: UkeSize, look: GLook, listen: ListenSample | null): Identification;
```

Rules for `identify` (verdict = `listen ? listenVerdict(listen) : "unclear"`):

1. `size === "baritone"` → `baritone`, basis `size`; conflict `size-vs-listen` if verdict is `reentrant`.
2. verdict `reentrant` → `c-high-g`, basis `listen`; conflict `look-vs-listen` if look is `thick`.
3. verdict `linear` → if size is `unknown` and `soundsBaritone(listen)` → `baritone`, else `c-low-g`;
   basis `listen`; conflict `look-vs-listen` if look is `thin`.
4. verdict `unclear`: look `thick` → `c-low-g` basis `look`; look `thin` → `c-high-g` basis `look`;
   look `unknown` → `c-high-g` basis `default` (most common; the tuner's octave warning catches the rest).

Unit tests (table, exact outputs):

| size | look | listen (s4, s3 Hz) | tuningId | basis | conflict |
|------|------|--------------------|----------|-------|----------|
| concert | thin | 389, 259 | c-high-g | listen | none |
| concert | unknown | 380, 270 | c-high-g | listen | none |
| tenor | thick | 196, 262 | c-low-g | listen | none |
| tenor | thin | 196, 262 | c-low-g | listen | look-vs-listen |
| soprano | thick | 392, 262 | c-high-g | listen | look-vs-listen |
| unknown | unknown | 147, 196 | baritone | listen | none |
| unknown | unknown | 190, 255 | c-low-g | listen | none |
| baritone | unknown | 150, 200 | baritone | size | none |
| baritone | unknown | 390, 260 | baritone | size | size-vs-listen |
| soprano | unknown | 300, 290 | c-high-g | default | none |
| soprano | thick | null | c-low-g | look | none |
| unknown | unknown | null | c-high-g | default | none |

Plus: `stringInterval({string4Hz: 392, string3Hz: 261.63})` ≈ 7.00 (±0.01);
`listenVerdict` at exactly +2.00 → `reentrant`, at +1.99 → `unclear`, at −2.00 → `linear`.

### 4.2 `src/core/stable-capture.ts`

Captures one plucked string's pitch for the listen step.

```ts
export interface StableCaptureOptions { minMs: number; toleranceCents: number }
export interface StableCapture {
  /** frequency 0 = no pitch this frame. Returns the median Hz once stable, else null. */
  push(frequency: number, timeMs: number): number | null;
  reset(): void;
}
export function createStableCapture(opts: StableCaptureOptions): StableCapture;
```

A run starts at the first non-zero frequency. Each new value must be within
`toleranceCents` of the run's median, otherwise the run restarts at that
value; `0` clears the run. When the run spans ≥ `minMs`, return the median of
the run (and keep returning null afterwards until `reset()`). App values:
`minMs = 300`, `toleranceCents = 30` (`config.ts`: `CAPTURE_MIN_MS`, `CAPTURE_TOLERANCE_CENTS`).

Tests: 25 frames of 392 Hz at 16.7 ms steps → first non-null at the frame
where elapsed ≥ 300 ms, value 392; ±10-cent jitter → still captures, median
returned; a 60-cent jump at 200 ms → no capture until 300 ms after the jump;
a single 0 at 150 ms → restarts; after a capture, further pushes return null.

### 4.3 Listen-step sequencing (`src/state/setup.ts`, see 4.6)

Slots: string 4 then string 3. The engine runs the tuner in **chromatic**
mode while `setup.step === "listen"` and feeds each frame's
`reading.frequency` (0 when `status !== "note"`) to the capture for the
active slot.

- After string 4 is captured, the string-3 slot only accepts frames after
  either ≥ 200 ms of silence (`status === "silent"`) or a frequency more than
  100 cents away from the string-4 capture. This stops the still-ringing
  string 4 from being captured twice.
- When both are captured: compute `listenVerdict`. `unclear` → show the
  "sounded the same" state (copy `setup.listen.same`) with **Start over**;
  otherwise enable **Next**.
- **Start over** clears both slots.
- Mic refused on this step → the slot card shows `setup.listen.noMic` and only
  Skip/Next (Next uses answers only, i.e. `listen = null`).

### 4.4 `src/core/guide.ts`

```ts
export const GUIDE_ORDER: readonly StringNumber[]; // [4, 3, 2, 1]
export interface GuideState {
  index: number;                  // 0..3 into GUIDE_ORDER
  round: 1 | 2;
  inTuneSinceMs: number | null;
  done: boolean;
}
export interface GuideFrame { stringNumber: StringNumber | null; inTune: boolean; timeMs: number }
export function startGuide(): GuideState;
export function stepGuide(s: GuideState, f: GuideFrame, holdMs: number): GuideState;
export function skipGuideString(s: GuideState): GuideState;
export function currentString(s: GuideState): StringNumber | null; // null when done
```

`stepGuide`: if `f.inTune` and `f.stringNumber === current`, set
`inTuneSinceMs` when null; once `timeMs − inTuneSinceMs ≥ holdMs` advance
(index+1; after index 3 of round 1 → round 2 index 0; after round 2 →
`done`), clearing `inTuneSinceMs`. Any frame not in tune on the current
string clears `inTuneSinceMs`. `holdMs` = `GUIDE_HOLD_MS = 1000`. Pure; the
engine sets tuner mode `{kind: "manual", stringNumber: current}` whenever the
current string changes, and back to auto on done/exit.

Tests: in tune for 999 ms → no advance; 1000 ms → advance; a break at 500 ms
restarts the hold; full sequence 4,3,2,1,4,3,2,1 → done; skip advances
exactly like a success; frames for another string are ignored.

### 4.5 `src/core/wrong-way.ts`

```ts
export interface WrongWayOptions { windowMs: number; growCents: number }
export interface WrongWayFrame { cents: number; noteActive: boolean; inTune: boolean; attack: boolean; timeMs: number }
export interface WrongWayDetector { push(f: WrongWayFrame): boolean; reset(): void }
export function createWrongWayDetector(o: WrongWayOptions): WrongWayDetector;
```

Keeps `|cents|` samples while `noteActive` and not `inTune`; clears them on
`!noteActive`, `inTune` or `attack` (a new pluck: the tuner already detects
level jumps for the attack skip; expose that flag on `TunerReading` as
`attack: boolean`). Returns true when, within the last `windowMs`, the
newest `|cents|` exceeds the smallest sample by ≥ `growCents` **and** the
samples are non-decreasing within 3 cents of noise. App values:
`windowMs = 800`, `growCents = 15`. The UI keeps the hint 4 s after the last true
(`WRONG_WAY_SHOW_MS = 4000`). Only active in guided tuning and manual mode.

Tests: −20, −25, −30, −36 over 700 ms → true at the last (spread over
900 ms the first sample falls out of the 800 ms window); the reverse order → false;
±3 cents noise around −20 for 2 s → false; an `attack` between samples → false;
`inTune` frame resets.

### 4.6 `src/state/setup.ts`

```ts
export type SetupStep = "hold" | "size" | "look" | "listen" | "result";
export interface SetupState {
  step: SetupStep;
  leftHanded: boolean;
  size: UkeSize | null;   // null = not answered yet (Next disabled)
  look: GLook | null;
  listen: { string4Hz: number | null; string3Hz: number | null; skipped: boolean };
}
export function startSetup(leftHanded: boolean): SetupState;
export function nextStep(s: SetupState): SetupState;   // size baritone skips "look"
export function prevStep(s: SetupState): SetupState;
export function canGoNext(s: SetupState): boolean;      // size/look answered; listen done, unclear-free, or skipped
export function result(s: SetupState): Identification; // identify(size ?? "unknown", look ?? "unknown", listen-or-null)
```

Tests: step order with and without baritone; back from "look" after
baritone was chosen goes to "size"; `canGoNext` per step; `result` mapping.

### 4.7 `src/core/pitch-math.ts`: `solfege(letter)`

`solfege("C")` → `"Dó"`, D Ré, E Mi, F Fá, G Sol, A Lá, B Si; accidentals
kept: `"F#"` → `"Fá♯"`, `"Bb"` → `"Si♭"`. Tests for all 7 + 2 accidentals.

### 4.8 `src/state/locale.ts`

```ts
export type Locale = "en" | "pt-BR";
export function resolveLocale(pref: Settings["language"], languages: readonly string[]): Locale;
```

`pref` other than `"auto"` wins; else the first entry of `languages` that
starts with `en` or `pt` (case-insensitive) decides: `pt…` → `"pt-BR"`,
`en…` → `"en"`; no such entry → `"en"`. Tests: `["pt-BR"]`, `["pt"]`,
`["PT-pt"]` → `pt-BR`; `["en-US","pt-BR"]` → `en`; `["fr-FR","pt-BR"]` →
`pt-BR`; `[]` → `en`; pref `"en"` with `["pt-BR"]` → `en`.

## 5. i18n architecture

- `src/i18n/en.ts` exports `en`: the current contents of `src/strings.ts`
  plus every new key in §8. `export type Strings = typeof en`.
- `src/i18n/pt-BR.ts` exports `ptBR: Strings` (the compiler enforces the
  same keys and function signatures).
- `src/strings.ts` becomes:
  `export let S: Strings = en; export function setLocale(l: Locale): void`
  (ES module live binding: every `import { S }` sees the swap).
- `main.ts`: before `mountApp`, `setLocale(resolveLocale(settings.language, navigator.languages))`
  and `document.documentElement.lang = locale`.
- Changing the language in Settings or on artboard 8 saves the setting and
  calls `location.reload()` (simplest correct re-render; the mic is stopped
  anyway on those screens).
- Tuning names: UI reads `S.tuningName(id)` instead of `tuning.name`
  (`tunings.ts` keeps its English names for tests and as fallback).
- Remove the remaining hard-coded English outside `strings.ts`:
  `rg -n '"[A-Z][a-z]+ [a-z]' src/ui src/state` (for example
  "No note detected" in `derive.ts`, aria-labels "Tuner", "Mode",
  "Microphone level"). All go through `S`.
- Note names stay letters everywhere on the tuner. In pt-BR, guidance text
  (setup, result, guided coach card) shows solfège after the letter:
  string map rows show `G` with `Sol` beneath (artboard 15); sentences use
  `G (Sol)`.
- Bundle: both locales are bundled (≈ 6 kB gzipped extra). Still far below 100 kB.
- The web manifest stays English (one manifest per build).

## 6. Screens (artboards → modules)

All new UI in `src/ui/setup-screen.ts` (one render function per step),
`src/ui/illustrations.ts` (SVG builders), `src/ui/guide-card.ts`. Use the
v1 tokens (`ui-spec.md`) and components (header back button, primary and
secondary buttons, segmented control, switch). Drawings: copy the SVG
geometry from the artboards; colours map to tokens (`#F5B942` → `--accent`,
`#E8E2D6` string colour → new token `--string` light `#6B6255` / dark
`#E8E2D6`, wood `#7A5A38`/`#4A3A2A`/`#3A2E22` → `--wood-1/2/3`, identical in both themes).

| Artboard | Screen | Notes |
|----------|--------|-------|
| 8 Start · first launch | `start-screen.ts`, `onboarded === false` | Language segmented control top-right (English / Português, `lang="pt-BR"` on that button). Primary two-line button "Set up my ukulele / About 1 minute". Secondary "I know my tuning · Start tuner" = v1 Start. Text link = v1 tones-only. Privacy card as v1. |
| 9 Setup 1/4 · Hold it | setup step `hold` | Header: back, "Step 1 of 4", Skip. 4-segment progress bar. Ukulele drawing (head left, string 4 top, amber): mirrored horizontally (`transform="scale(-1 1)"` on the drawing group, labels not mirrored) when the left-handed switch is on. Switch writes `settings.leftHanded`. Three numbered bullets. Next always enabled. |
| 10 Setup 2/4 · Size | step `size` | Five toggle buttons (`aria-pressed`), one selected at a time: 4 sizes with silhouettes scaled 0.70 / 0.76 / 0.87 / 1.00 and the tuning letters (baritone's in `--warn`), plus dashed "Not sure · let the app listen". Info card. Next disabled until one is chosen. |
| 11 Setup 3/4 · Look at string 4 | step `look` | Two picture cards (thin vs thick wound) + dashed "Can't tell". Warning card (`--warn-bg`). Next disabled until chosen. Skipped for baritone (progress shows 3 of 4 → 4 of 4 directly). |
| 12 Setup 4/4 · Listen | step `listen` | Mic starts on entering the step only if it was already granted; otherwise a primary "Start listening" button (user gesture) replaces the slots. Slot cards: done (green check, note + Hz), active (amber, "Pluck it now…" + level bar), waiting (muted). Strings drawing highlights the active string. `aria-live="polite"` on the slot list. Start over + Next. |
| 13 Result | step `result` | "Found it" card with size (omitted when unknown) and tuning; explanation sentence by basis/conflict (§8 `setup.result.why.*`); string map rows from the chosen tuning (number badge, letter, octave · Hz, position hint on strings 4 and 1, thickness line by pitch within the tuning: highest string 1.8 px, lowest 3.4 px, linear by MIDI in between); tips card. Conflict → the card's check becomes the warning icon and the title "Check this", with buttons "Listen again" (back to 12) and the primary still applying the result. Primary "Tune it with me" saves `tuningId`, `ukuleleSize`, `onboarded = true` and starts guided tuning (mic). Link "Not right? Pick the tuning myself" saves `onboarded = true` and opens Settings. |
| 14 Guided tuning | `tuner-screen.ts` with `guide` | Header: × (leave), "Guided tuning", "Round 1 of 2". Coach card replaces the tuning row: step label, 4 progress pills, "String 4 · G", position hint for the current string. Note display, needle as v1. Wrong-way alert (`role="alert"`) between note and needle when `wrongWay`. String tiles without the play buttons; current tile accent, done tiles show a check and `--ok`, next tile says "Next". Footer: hint + "Skip string". Done → coach card turns `--ok-bg`: "All four strings are in tune." with buttons "Go round again" and "Done". |
| 15 Result · pt-BR | same as 13 in pt-BR | Checks that Portuguese copy fits; solfège under each letter. |

Settings (artboard 6, not redrawn): add a **Language** row (segmented:
Auto / English / Português) after Theme, and the "Not sure? Find my
ukulele" link under the Tuning select. Help (artboard 7): first card
"Which ukulele do I have?" with one sentence and a secondary button.

Accessibility: every toggle is a `<button aria-pressed>`; progress bars are
decorative (`aria-hidden`), the "Step n of 4" text carries the meaning;
drawings have `role="img"` + `aria-label` (copy in §8); focus moves to the
step heading on each step change.

## 7. Engine changes (`src/engine.ts`)

- Setup listen step: tuner mode chromatic; per frame feed
  `reading.frequency` (or 0) and `reading.status` to the setup sequencing
  (§4.3) through an action-free internal call; store the captured Hz in
  `setup.listen`.
- Guided tuning: on start `guide = startGuide()`, mode manual on string 4;
  each frame `stepGuide(...)` with `reading.inTune`/`reading.stringNumber`;
  on index change set the new manual string and `vibrate(30)`; feed the
  wrong-way detector; `wrongWay` true until `WRONG_WAY_SHOW_MS` after the
  last detection.
- `TunerReading.attack: boolean` (true on the frame the tuner's attack skip
  starts). Test in `tuner.test.ts`.

## 8. Copy (en / pt-BR)

Keys are paths in `Strings`. Owner reviews pt-BR before T38 is ticked.

| Key | English | Português (Brasil) |
|-----|---------|--------------------|
| `start.firstLead` | New to the ukulele? We will find out which one you have and tune it with you, step by step. | É novo no ukulele? Vamos descobrir qual é o seu e afiná-lo com você, passo a passo. |
| `start.setup` | Set up my ukulele | Configurar meu ukulele |
| `start.setupSub` | About 1 minute | Cerca de 1 minuto |
| `start.knowTuning` | I know my tuning · Start tuner | Já sei minha afinação · Abrir afinador |
| `start.setupLink` | New to the ukulele? Set up my ukulele | Novo no ukulele? Configurar meu ukulele |
| `language.label` | Language | Idioma |
| `language.auto` / `.en` / `.pt` | Auto / English / Português | Automático / English / Português |
| `setup.step` (n) | Step {n} of 4 | Passo {n} de 4 |
| `setup.skip` / `.next` / `.back` | Skip / Next / Back | Pular / Avançar / Voltar |
| `setup.hold.title` | Hold it like this | Segure assim |
| `setup.hold.face` / `.floor` | ↑ Toward your face / ↓ Toward the floor | ↑ Para o seu rosto / ↓ Para o chão |
| `setup.hold.b1` | Neck to your left, strings facing out. Strum over the sound hole with your right hand. | Braço para a esquerda, cordas para fora. Toque sobre a boca com a mão direita. |
| `setup.hold.b1Left` | Neck to your right, strings facing out. Strum over the sound hole with your left hand. | Braço para a direita, cordas para fora. Toque sobre a boca com a mão esquerda. |
| `setup.hold.b2` | String 4 is the one closest to your face. String 1 is closest to the floor. | A corda 4 é a mais perto do seu rosto. A corda 1 é a mais perto do chão. |
| `setup.hold.b3` | Each string ends at one peg on the head. Run a finger along it to find its peg. | Cada corda termina em uma tarraxa na mão do ukulele. Passe o dedo pela corda para achar a tarraxa dela. |
| `setup.hold.lefty` / `.leftySub` | I play left-handed / Neck to your right; the drawing flips | Sou canhoto / Braço para a direita; o desenho inverte |
| `setup.hold.drawingLabel` | Ukulele as you hold it: head on the left, string 4 at the top nearest your face, string 1 at the bottom nearest the floor | Ukulele como você segura: mão à esquerda, corda 4 em cima, mais perto do rosto, corda 1 embaixo, mais perto do chão |
| `setup.hold.headLabel` / `.strumLabel` | Head and pegs / Strum here | Mão e tarraxas / Toque aqui |
| `setup.size.title` / `.lead` | How big is it? / Measure from the top of the head to the bottom of the body. | Qual o tamanho? / Meça do topo da mão até o fim do corpo. |
| `setup.size.names` | Soprano, Concert, Tenor, Baritone | Soprano, Concert, Tenor, Barítono |
| `setup.size.length` (cm, in) | About {cm} cm · {in} in | Cerca de {cm} cm |
| `setup.size.unsure` | Not sure · let the app listen | Não sei · deixar o app ouvir |
| `setup.size.info` | Soprano, concert and tenor all tune the same: G C E A. Only baritone is different. The size is often on a label inside the sound hole. | Soprano, concert e tenor afinam igual: G C E A (Sol Dó Mi Lá). Só o barítono é diferente. O tamanho costuma estar numa etiqueta dentro da boca. |
| `setup.look.title` / `.lead` | Look at string 4 / The one closest to your face. Compare it with string 3, right next to it. | Olhe a corda 4 / A mais perto do seu rosto. Compare com a corda 3, logo ao lado. |
| `setup.look.thin` / `.thinTag` | Thinner than string 3 / High G · most common | Mais fina que a corda 3 / Sol agudo · o mais comum |
| `setup.look.thick` / `.thickSub` / `.thickTag` | Thicker than string 3 / Often metal-wound, like a guitar string / Low G | Mais grossa que a corda 3 / Muitas vezes encapada de metal, como corda de violão / Sol grave |
| `setup.look.unsure` | Can't tell · let the app listen | Não sei dizer · deixar o app ouvir |
| `setup.look.warn` | This matters: a low-G string tuned up to high G will snap, and a high-G string tuned down goes floppy. | Isso importa: uma corda de Sol grave afinada até o Sol agudo arrebenta, e uma de Sol agudo afinada para baixo fica frouxa. |
| `setup.listen.title` / `.lead` | Let the app listen / Pluck string 4, then string 3. One at a time, and let each ring. | Deixe o app ouvir / Toque a corda 4 e depois a corda 3. Uma de cada vez, deixando soar. |
| `setup.listen.start` | Start listening | Começar a ouvir |
| `setup.listen.string` (n) | String {n} | Corda {n} |
| `setup.listen.heard` / `.now` / `.waiting` | Heard / Pluck it now… / Next | Ouvida / Toque agora… / Em seguida |
| `setup.listen.info` | On a high-G ukulele string 4 sounds higher than string 3. On low-G and baritone it sounds lower. This works even if it is out of tune. | Num ukulele de Sol agudo a corda 4 soa mais aguda que a corda 3. No Sol grave e no barítono, soa mais grave. Funciona mesmo desafinado. |
| `setup.listen.same` | Those two sounded the same. Pluck string 4, then the string next to it (string 3). | As duas soaram iguais. Toque a corda 4 e depois a que fica ao lado dela (corda 3). |
| `setup.listen.noMic` | The microphone is off, so this check is skipped. Your answers will be used. | O microfone está desligado, então esta verificação será pulada. Vamos usar suas respostas. |
| `setup.listen.restart` | Start over | Recomeçar |
| `setup.listen.privacy` | Uses the microphone. Nothing is recorded or uploaded. | Usa o microfone. Nada é gravado nem enviado. |
| `setup.result.title` | Your ukulele | Seu ukulele |
| `setup.result.found` / `.check` | Found it / Check this | Encontramos / Confira |
| `setup.result.headline` (size, g) | {Size} · high G / {Size} · low G / Baritone | {Tamanho} · Sol agudo / {Tamanho} · Sol grave / Barítono |
| `setup.result.why.listenLook` | String 4 sounded higher than string 3, and you said it looks thinner. Both mean high G. (and the low-G mirror) | A corda 4 soou mais aguda que a corda 3, e você disse que ela parece mais fina. As duas coisas indicam Sol agudo. (e o espelho para Sol grave) |
| `setup.result.why.listen` | String 4 sounded higher (lower) than string 3. That means high G (low G). | A corda 4 soou mais aguda (grave) que a corda 3. Isso indica Sol agudo (grave). |
| `setup.result.why.look` | You said string 4 is thinner (thicker) than string 3. That means high G (low G). | Você disse que a corda 4 é mais fina (grossa) que a corda 3. Isso indica Sol agudo (grave). |
| `setup.result.why.size` | Baritone ukuleles are tuned D G B E, like the top four guitar strings. | Ukuleles barítono são afinados em D G B E (Ré Sol Si Mi), como as quatro cordas mais finas do violão. |
| `setup.result.why.default` | Most ukuleles are high G, so we picked it. If a string sounds an octave off, the tuner will warn you. | A maioria dos ukuleles é de Sol agudo, então escolhemos essa. Se uma corda soar uma oitava fora, o afinador avisa. |
| `setup.result.why.conflict` | What you saw and what we heard do not match. Pluck strings 4 and 3 again, or check which string is closest to your face. | O que você viu e o que ouvimos não combinam. Toque as cordas 4 e 3 de novo, ou confira qual corda está mais perto do seu rosto. |
| `setup.result.face` / `.floor` / `.lowest` | Closest to your face / Closest to the floor / Lowest note | Mais perto do rosto / Mais perto do chão / A nota mais grave |
| `setup.result.tip1` | Tighten a peg to raise the note, loosen it to lower the note. | Aperte a tarraxa para deixar a nota mais aguda, afrouxe para deixá-la mais grave. |
| `setup.result.tip2` | Turn a little, pluck again. If the needle moves the wrong way, turn the other way. | Gire um pouquinho e toque de novo. Se o ponteiro for para o lado errado, gire para o outro lado. |
| `setup.result.guide` / `.manual` / `.again` | Tune it with me / Not right? Pick the tuning myself / Listen again | Afinar comigo / Não é esse? Escolher a afinação / Ouvir de novo |
| `guide.title` / `.round` (n) | Guided tuning / Round {n} of 2 | Afinação guiada / Volta {n} de 2 |
| `guide.step` (n) / `.string` (n, letter) | Step {n} of 4 / String {n} · {letter} | Passo {n} de 4 / Corda {n} · {letter} ({solfège}) |
| `guide.hint4` / `.hint1` / `.hintMid` | Closest to your face. Follow it to its peg, pluck it, and turn the peg slowly. / Closest to the floor. … / Follow it to its peg, pluck it, and turn the peg slowly. | Mais perto do rosto. Siga a corda até a tarraxa, toque e gire devagar. / Mais perto do chão. … / Siga a corda até a tarraxa, toque e gire devagar. |
| `guide.wrongWay` (letter) | **Getting further away.** Turn the {letter} peg the other way. | **Está se afastando.** Gire a tarraxa da corda {letter} para o outro lado. |
| `guide.footer` / `.skip` / `.next` | Hold it in the green for a second and we move on. / Skip string / Next | Segure no verde por um segundo e seguimos. / Pular corda / Em seguida |
| `guide.done` / `.again` / `.finish` | All four strings are in tune. / Go round again / Done | As quatro cordas estão afinadas. / Dar outra volta / Pronto |
| `guide.leave` | Leave guided tuning | Sair da afinação guiada |
| `settings.findMine` | Not sure? Find my ukulele | Não sabe? Descobrir meu ukulele |
| `helpScreen.which` / `.whichBody` | Which ukulele do I have? / A one-minute check finds your tuning: size, string 4, and a quick listen. | Qual ukulele eu tenho? / Uma verificação de um minuto descobre sua afinação: tamanho, corda 4 e uma escuta rápida. |
| `pill.*` (pt-BR only) | — | Afinado / Apertar / Afrouxar |
| `flatLabel` / `sharpLabel` (pt-BR only) | — | ♭ abaixo / acima ♯ |
| tuning names (pt-BR only) | — | Padrão em Dó (Sol agudo), Padrão em Dó (Sol grave), Barítono, Ré (Lá agudo), Canadense (Lá grave), Slack-key, Si♭, Meio tom abaixo, Sol antigo (vintage) |

The pt-BR translation of every existing v1 string (start, tuner, mic
errors, settings, help) is part of T29 and follows the glossary in
`docs/knowledge/08-beginners.md`.

## 9. E2E tests (Playwright)

- `test/e2e/wav.ts` gains `writeSequence(name, segments: {freq, seconds}[])`
  (freq 0 = silence). Fixtures: `g4-c4.wav` (G4 1.2 s, silence 0.4 s, C4 1.2 s,
  silence 0.6 s; loops) and `g3-c4.wav` (G3, silence, C4, silence).
- `setup.spec.ts`:
  - First launch shows artboard 8; "I know my tuning" sets onboarded (reload → v1 start screen with the setup link).
  - Full wizard with `g4-c4.wav`: concert, thin → listen captures both → result "Concert · high G", tuning select later shows high G.
  - With `g3-c4.wav`, size unknown, look unknown → "low G".
  - Baritone skips the look step.
  - Guided tuning with `g4.wav` (in tune) → step 1 completes within 3 s and the coach moves to string 3.
- `i18n.spec.ts`: context with `locale: "pt-BR"` → start screen in Portuguese
  and `<html lang="pt-BR">`; switching to English in Settings reloads in
  English; every screen at 390×844 has `document.documentElement.scrollWidth <= 390` in pt-BR.
- `a11y.spec.ts`: add setup steps 9–13 and guided tuning, in both themes and in pt-BR.

## 10. Out of scope

Auto-detecting the full tuning from all four strings; peg-direction
memory per peg; photos; more languages (the structure allows adding one
file); bass ukulele, guitalele and 6/8-string ukuleles (Help mentions
they are not supported).
