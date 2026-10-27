# ukulele-tune

A web app for tuning a ukulele with the device microphone (and by ear with
reference tones). Runs entirely in the browser; no audio leaves the device.

**Status: planning.** No application code yet. The repository currently holds
the research the implementation will be based on and the list of decisions
still open.

## Documentation

Knowledge base (`docs/knowledge/`):

| File | Contents |
|------|----------|
| [01-ukulele.md](docs/knowledge/01-ukulele.md) | History, sizes, strings, re-entrant tuning, intonation, environmental drift |
| [02-tunings.md](docs/knowledge/02-tunings.md) | Every tuning preset with notes, MIDI numbers and Hz; detector pitch range; data model |
| [03-tuning-technique.md](docs/knowledge/03-tuning-technique.md) | How people tune, tuner modes, beginner failure modes, tuning by ear |
| [04-pitch-and-math.md](docs/knowledge/04-pitch-and-math.md) | Equal temperament, MIDI ↔ Hz, cents, resolution limits, harmonics and octave errors |
| [05-pitch-detection.md](docs/knowledge/05-pitch-detection.md) | Algorithm comparison (ACF, YIN, MPM), libraries, proposed pipeline and parameters |
| [06-web-audio-platform.md](docs/knowledge/06-web-audio-platform.md) | getUserMedia constraints, AudioContext/iOS gesture rules, AnalyserNode vs AudioWorklet, PWA |
| [07-tuner-ux.md](docs/knowledge/07-tuner-ux.md) | Screen layout, needle conventions, auto string selection, accessibility, i18n |
| [sources.md](docs/knowledge/sources.md) | References |

Planning (`docs/planning/`):

- [decisions.md](docs/planning/decisions.md): decisions made so far and the defaults in force.
- [open-questions.md](docs/planning/open-questions.md): remaining decisions, each with the default that will be used if unanswered.

## Core facts in one paragraph

Standard ukulele tuning is G4-C4-E4-A4 (392.00, 261.63, 329.63, 440.00 Hz),
*re-entrant*: the 4th string is higher than the 3rd. Low-G (G3 = 196.00 Hz)
and baritone (D3-G3-B3-E4) are the other common tunings. A tuner measures the
open-string fundamental, converts to cents (`1200·log2(f/target)`) and shows
flat/sharp; ±5 cents is the usual "in tune" window. In the browser this means
`getUserMedia` with echo cancellation, noise suppression and auto gain **off**,
an `AudioContext` started from a tap (iOS), a 2048–4096 sample window, and a
time-domain detector (McLeod Pitch Method or YIN) with a clarity threshold,
range limit (100–1000 Hz) and median smoothing.
