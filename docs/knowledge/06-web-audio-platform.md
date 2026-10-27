# Web platform: microphone, Web Audio and browser quirks

## Security and permissions

- `getUserMedia` works only in **secure contexts**: HTTPS, or `localhost`
  during development. GitHub Pages / Vercel / Netlify are all HTTPS.
- The browser prompts for microphone permission on the first call. Handle
  `NotAllowedError` (denied), `NotFoundError` (no mic), `NotReadableError`
  (mic in use by another app), `OverconstrainedError`. Offer the
  reference-tone mode when the mic is unavailable.
- Use the Permissions API (`navigator.permissions.query({name:"microphone"})`)
  where supported to show state before prompting; Safari support is partial,
  so never depend on it.
- Stop all tracks (`track.stop()`) when the tuner is closed or the page is
  hidden (`visibilitychange`), otherwise the browser keeps the red "recording"
  indicator on and iOS may kill audio on return from background.

## Requesting the mic for a tuner

```js
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    // channelCount: 1, sampleRate: 48000  // hints only; do not require
  },
});
console.log(stream.getAudioTracks()[0].getSettings()); // verify what we got
```

- All three processing flags default to **on** in Chrome and Firefox and
  they damage a tuner: AGC pumps levels, noise suppression attenuates
  sustained tones, echo cancellation can remove the app's own reference tone.
- Browsers may ignore the request; read back `getSettings()` and log it. In
  Firefox, turning off `echoCancellation` alone also turns off the other two.
  iOS Safari historically honoured these poorly; test on a real device.
- Never hard-code the sample rate. Use `audioContext.sampleRate` (44 100 on
  many Apple devices, 48 000 on most others) in every calculation.

## AudioContext lifecycle

- Create or `resume()` the `AudioContext` **inside a user gesture handler**
  (tap/click). iOS Safari has always required this, and the mic permission
  does not count as the gesture. Check `ctx.state === "running"` afterwards
  and show a "tap to start" button if it is not.
- `pointerup` has been reported not to count on some iOS versions;
  `touchend`/`click` do. Use `click`.
- Events fired from inside audio callbacks, synthetic events and `el.click()`
  do not count as gestures.
- On iOS, when the app returns from background the context can be silently
  suspended; call `resume()` again on `visibilitychange` → visible and on the
  next tap. A late-2025 WebKit bug reports `resume()` failing with
  `InvalidStateError` inside home-screen PWAs; re-creating the context is the
  fallback.
- iOS mutes Web Audio **output** when the ringer switch is on silent; mic
  input still works. Tell users this on the reference-tone screen.

## Getting samples: three options

| Option | How | Pros | Cons |
|--------|-----|------|------|
| **AnalyserNode** (recommended v1) | `analyser.fftSize = 2048/4096`; each animation frame call `getFloatTimeDomainData(Float32Array(fftSize))` | tiny code, main thread, no extra files, works everywhere | timing tied to rAF; pauses when tab hidden (fine for a tuner); windows overlap arbitrarily |
| AudioWorklet | `ctx.audioWorklet.addModule('worklet.js')`; processor receives 128-sample blocks, accumulates, runs detector, `port.postMessage` | precise, off main thread, keeps running when hidden | separate module file, bundler config, iOS ≥ 14.5 only, more code |
| ScriptProcessorNode | deprecated | nothing | deprecated, main-thread, glitchy |

The analyser's time-domain buffer has `fftSize` samples (not
`frequencyBinCount`). The detector's input length must match.

## Playing a reference tone

`OscillatorNode` (sine or triangle) → `GainNode` with a short attack/release
envelope (5–20 ms) to avoid clicks → `ctx.destination`. Frequency from the
same MIDI→Hz function the tuner uses, so calibration applies. Pause pitch
detection, or at least ignore readings within a few cents of the tone, while
it plays, to avoid the app tuning to itself.

## Offline / PWA

A tuner is used in rehearsal rooms with bad signal. A `manifest.json` plus a
service worker that pre-caches the app shell makes it installable and
offline-capable. Note the iOS PWA audio caveats above. Keep the bundle small
(the whole app should be well under 200 kB).

## Minimum browser support (proposed)

- Chrome/Edge 90+, Firefox 90+, Safari 14.1+ (iOS 14.5+). `AudioWorklet` is
  available on all of these; `AnalyserNode` on everything.
- Android Chrome, iOS Safari and desktop browsers are the real targets.
  WebViews inside Instagram/Facebook often deny `getUserMedia`; detect and
  tell the user to open in the browser.

## Privacy

Audio never leaves the device: everything runs locally and nothing is
uploaded. State this in the UI; it also means no backend is needed.
