# Tuner UX: what a good tuner screen does

## Conventions users already know (from clip-on tuners and apps)

- Big note name with octave ("G4"), and the cents offset as a number.
- A horizontal needle/arc from −50 to +50 cents, centre marked. Left = flat
  (string too low, **tighten**), right = sharp (**loosen**). The direction
  words matter more than the symbols for beginners.
- Colour: green in the window, amber/red outside, and never colour alone:
  also move the needle, show text, and optionally vibrate
  (`navigator.vibrate`) when a string locks in.
- Strobe-style display is a cosmetic alternative; it does not add accuracy.
  Skip for v1.
- Hold the last reading for ~1 s after the note dies so the user can read it,
  then grey it out.
- Show a level meter so users know the mic is picking something up.

## Screens (v1 proposal)

1. **Tuner**: tuning selector (default: Standard C, high G), four string
   buttons in 4→1 order (G C E A) drawn like a headstock, auto/manual toggle,
   needle, note + cents, in-tune indicator, mic level, A4 reference badge
   when ≠ 440, "play tone" button per string.
2. **Settings**: A4 reference (415–466, default 440), in-tune window (±5 /
   ±3), sharps or flats, left-handed layout (mirror the headstock), theme,
   language, noise gate level, buffer size (advanced).
3. **Help**: how to tune (from `03-tuning-technique.md`), re-entrant / high-G
   vs low-G explanation, why the needle jumps, mic troubleshooting (HTTPS,
   permission, iOS tap-to-start), about + privacy.

## Auto string selection logic

Given detected `hz` and the selected tuning's strings, choose the string whose
target is nearest in cents. Then:
- if |cents| ≤ 50: normal display against that string;
- if the nearest string is ~1200 cents away from another string's target
  (octave), prefer the user's manually chosen string if any, else show an
  "octave?" hint;
- when the user taps a string, lock to it until they tap again or tap "auto".

## Onboarding / empty states

- First launch: one screen explaining "tap Start, allow the microphone, pluck
  a string". Start button doubles as the required user gesture.
- Mic denied: explain how to re-enable and offer the reference tones.
- No signal for 10 s: hint "pluck one string near the sound hole".

## Accessibility and i18n

- Semantic live region announcing "G4, 12 cents flat, tighten" at a throttled
  rate for screen readers.
- Large touch targets (strings are the main control).
- Strings and copy in Portuguese and English at least; note names use the
  same letters in both (Brazil uses letter names as well as dó-ré-mi; offer
  solfège as a display option: G = Sol, C = Dó, E = Mi, A = Lá).
