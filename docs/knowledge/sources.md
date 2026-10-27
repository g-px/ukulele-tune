# Sources consulted

Direct page fetches were blocked for most sites in the research session
(ukutabs.com, cdn.jsdelivr.net, developer.mozilla.org, en.wikipedia.org were
not resolvable), so these are the search results and summaries that the
knowledge files were built from, plus the standard references for the
algorithms. Verify specifics against the primary pages when they are
reachable.

## Instrument, tunings, technique
- UkuTabs tuner and tuning guide: https://ukutabs.com/ukulele-tuner/ and https://ukutabs.com/ukulele-guides/different-ukulele-tunings/
- UkuTabs, low G vs high G: https://ukutabs.com/ukulele-guides/low-g-vs-high-g-ukulele/
- Got A Ukulele, alternative tunings: https://www.gotaukulele.com/2016/09/dont-be-afraid-of-alternative-ukulele.html
- Got A Ukulele, re-entrant tuning for beginners: https://www.gotaukulele.com/2011/03/ukulele-beginners-what-is-re-entrant.html
- Ukulele Hunt on D tuning: https://ukulelehunt.com/?p=1132
- MasterClass, re-entrant tuning: https://www.masterclass.com/articles/how-to-use-reentrant-tuning-on-a-ukulele
- Gretsch, re-entrant tuning: https://blog.gretschguitars.com/2014/01/gretschtech-reentrant-tuning/
- EBSCO research starter, ukulele history: https://ebsco.com/research-starters/music/ukulele
- Wikipedia, Ukulele (sizes, history): https://en.wikipedia.org/wiki/Ukulele
- Wikipedia, Electronic tuner (accuracy figures): https://en.wikipedia.org/wiki/Electronic_tuner
- Peterson iStroboSoft user guide (calibration, hum filter): https://www.petersontuners.com/media/pdf/iStroboSoft_UG.pdf
- String stretching guides: https://mediahub.lazada.sg/how-to-change-and-stretch-new-ukulele-strings-to-keep-them-in-tune-sg/
- Martin ukulele strings (tension figures): https://www.martinguitar.com/strings/ukulele/41Y18M620.html
- Hannabach fluorocarbon strings: https://hannabach.gewamusic.com/en/strings/ukulele-flourocarbon
- Intonation discussions: https://umgf.com/uke-intonation-t3919.html , https://community.justinguitar.com/t/intonation-open-string-harmonic-and-fretted-note/394519

## Pitch math
- MIDI tuning standard: https://en.wikipedia.org/wiki/MIDI_tuning_standard
- McGill MUMT 307 notes (MIDI ↔ frequency, cents): https://www.music.mcgill.ca/~gary/307/week1/node28.html
- teoria.com on cents: https://teoria.com/en/articles/2020/cents/08.php

## Pitch detection
- A. de Cheveigné & H. Kawahara, "YIN, a fundamental frequency estimator for speech and music", JASA 2002.
- P. McLeod & G. Wyvill, "A Smarter Way to Find Pitch", ICMC 2005.
- pitchy (MPM in JS): https://github.com/ianprime0509/pitchy , https://www.npmjs.com/package/pitchy
- pitchfinder: https://github.com/peterkhayes/pitchfinder
- @chordbook/tuner (pitchy-based reference config): https://github.com/chordbook/tuner
- PitchDetect demo (autocorrelation): https://github.com/cwilso/PitchDetect
- sevagh/pitch-detection (C++/WASM YIN & MPM): https://github.com/sevagh/pitch-detection

## Web platform
- addpipe, getUserMedia audio constraints: https://blog.addpipe.com/audio-constraints-getusermedia/
- Chrome blog, hardware noise suppression: https://developer.chrome.com/blog/disabling-hardware-noise-suppression/
- MDN, ScriptProcessorNode (deprecated): https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createScriptProcessor
- Chrome blog, AudioWorklet: https://developer.chrome.com/blog/audio-worklet
- Unlocking Web Audio on iOS/Safari: https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos
- WebKit bugs on AudioContext/user gesture and PWA audio: https://bugs.webkit.org/show_bug.cgi?id=177292 , https://bugs.webkit.org/show_bug.cgi?id=291892
- Apple developer forum thread on iOS 26.0.1 PWA audio: https://developer.apple.com/forums/thread/805900
