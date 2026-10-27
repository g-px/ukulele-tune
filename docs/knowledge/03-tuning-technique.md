# How people actually tune a ukulele (and what the app must support)

## The basic procedure

1. Pick a tuning (almost always standard C, high G).
2. For each string, 4 → 1 or any order: pluck the open string near the sound
   hole with moderate force, let it ring, read the tuner, turn the peg.
3. **Turn the peg the right way.** Tightening raises pitch. Beginners
   regularly turn the wrong way and go further out; the app should make the
   direction obvious ("tighten" / "loosen", or an arrow, not just ♭/♯).
4. **Approach the target from below.** If the string is sharp, loosen it past
   the target and tighten back up. This removes slack in the peg and keeps
   the string from slipping flat afterwards.
5. Go round all four strings a second time. Changing one string's tension
   shifts the others a few cents, most noticeably on sopranos.
6. On new strings: stretch gently, retune, repeat 3–5 times. Expect drift for
   several days.

## What a reading on an electronic tuner means

- The tuner compares the detected fundamental frequency with the nearest
  target and shows the error in **cents** (1/100 of a semitone; see
  `04-pitch-and-math.md`).
- Conventions: needle centred = in tune; left = flat (too low, tighten);
  right = sharp (too high, loosen). Green = in tune. Most hardware tuners
  consider ±3 to ±5 cents "in tune"; typical clip-on accuracy is ±3 cents,
  cheap LED tuners drift up to ±9 cents, strobe tuners resolve 0.1 cent.
- A reading of "A" alone is ambiguous between A3 and A4. The app must display
  the octave number.

## Tuner modes

- **Auto / chromatic:** the tuner names whatever note it hears, nearest
  semitone. Simple but allows octave mistakes and reports "D#" when the user
  wanted "E" without saying "you are 90 cents flat of E".
- **Instrument / string mode (preferred for v1):** the user chooses the
  tuning; the app shows four strings; the app either auto-selects the string
  whose target is nearest the detected pitch, or lets the user tap the string.
  The cents error is then measured against that string's target, so a very
  flat E string shows "E, −90 cents, tighten" instead of "D#, +10".
- **Manual string selection + reference tone (tune by ear):** play the target
  pitch through the speaker; the user matches it by ear. Important for people
  who tune by ear, for noisy rooms, and when the mic is denied. Playing a
  plucked-string-like sample sounds better than a sine, but a sine or triangle
  wave from an `OscillatorNode` is enough for v1.

## Common beginner problems the app should anticipate

| Problem | Cause | What the app can do |
|---------|-------|---------------------|
| String snaps while tuning | Tuning a low-G string toward G4, or any string an octave too high | Show octave; warn when pitch ≈ target/2 or target·2; show "this string should sound *lower/higher* than the C string" hints |
| Can't get the G string "right" | User expects G4 to be lower than C4 (does not know about re-entrant tuning) | Explain re-entrant tuning in-app; show the high-G target explicitly |
| Needle jumps around | Attack transient, noise, two strings ringing, AGC/noise suppression on the mic | Ignore the first ~50–100 ms after a pluck; require clarity; disable browser audio processing; median-smooth |
| Tuner reads a note while nothing is played | Mains hum, fan, speech, TV | Volume gate; high-pass ≥ 80 Hz; clarity threshold |
| String reads in tune, then flat a minute later | New strings, peg slack, tuned *down* to pitch | Tips in-app: tune up to pitch, stretch new strings, second pass |
| Everything is off by the same amount | Reference pitch set to something other than 440, or capo | Show the A4 reference on screen whenever it is not 440 |
| Mic works on desktop, nothing on iPhone | AudioContext not started in a tap, or page not on HTTPS | See `06-web-audio-platform.md` |

## Tuning by ear: relative method (no tuner)

Useful content for a "help" page and for a future "relative tuning" feature:

- Fret the C string (3rd) at the 4th fret → E, match the open 2nd (E) string.
- Fret the E string (2nd) at the 5th fret → A, match the open 1st (A) string.
- Fret the A string (1st) at the 10th fret → G4... in practice people instead
  fret the C string at the 7th fret → G4 and match the open 4th (G) string.
- Only one string then needs an external reference (a tuning fork, piano, or
  the app's reference tone).

## Intonation check (post-v1 idea)

Play the 12th-fret harmonic (touch, do not press, directly above the 12th
fret) and then the fretted 12th-fret note. Both should read the same note, an
octave above the open string. If the fretted note is sharp, the saddle needs
to move back (or the action is too high); if flat, forward. The app can
measure both and report the difference in cents.
