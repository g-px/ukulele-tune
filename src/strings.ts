/** Every user-facing string. English only for v1. */
import type { MicError } from "./audio/mic-errors";

export const S = {
  appName: "Ukulele Tune",
  help: "Help",
  settings: "Settings",
  back: "Back to tuner",
  tuning: "Tuning",

  start: {
    instruction: "Tap start, allow the microphone, then pluck one string at a time.",
    startTuner: "Start tuner",
    tonesOnly: "Tune by ear with reference tones",
    privacy: "Audio never leaves your device. Everything runs in your browser and works offline.",
  },

  pill: { inTune: "In tune", tighten: "Tighten", loosen: "Loosen" },
  flatLabel: "♭ flat",
  sharpLabel: "sharp ♯",
  modeAuto: "Auto",
  modeChromatic: "Chromatic",
  locked: (letter: string) => `Locked: ${letter} · tap Auto to unlock`,
  a4Badge: (a4: number) => `A4 = ${a4}`,
  playTone: (note: string) => `Play ${note} reference tone`,
  stopTone: (note: string) => `Stop ${note} reference tone`,

  status: {
    starting: "Starting microphone…",
    listening: "Listening… pluck one string near the sound hole.",
    noSignal: "Nothing heard yet. Pluck one string near the sound hole.",
    heard: (hz: number) => `Heard ${Math.round(hz)} Hz`,
    tighten: (s: string) =>
      `Turn the ${s} peg to raise the pitch. Go past the mark and come back up if it slips.`,
    loosen: (s: string) => `Turn the ${s} peg to lower the pitch, then come back up to the mark.`,
    inTune: (s: string) => `${s} is in tune. Pluck the next string.`,
    playingTone: (note: string) => `Playing ${note} reference tone`,
    micOff: "Microphone off · tones only. Tap a ▶ button to hear a string.",
  },

  octave: {
    low: "Sounds an octave low.",
    high: "Sounds an octave high.",
    lowBody: (note: string) =>
      `Is this a low string? Do not tighten it up to ${note}; it can snap.`,
    highBody: (note: string) =>
      `Is this a high string? It should sound an octave lower than ${note} on this tuning.`,
    switchTo: (name: string) => `Switch to ${name}`,
  },

  announce: (note: string, cents: number, action: string) =>
    cents === 0 || action === "in tune"
      ? `${note}, in tune`
      : `${note}, ${Math.abs(Math.round(cents))} cents ${cents < 0 ? "flat" : "sharp"}, ${action}`,

  micError: {
    title: {
      denied: "Microphone blocked",
      "not-found": "No microphone found",
      "in-use": "Microphone is busy",
      "insecure-context": "Secure page needed",
      unsupported: "Audio capture not supported",
      unknown: "Microphone problem",
    } satisfies Record<MicError, string>,
    cause: {
      denied:
        "The browser refused access to the microphone, so the tuner cannot hear your strings.",
      "not-found": "This device has no microphone the browser can use.",
      "in-use": "Another app or tab is using the microphone right now.",
      "insecure-context": "Browsers only allow the microphone on https:// pages or localhost.",
      unsupported: "This browser cannot capture audio. Try a current Chrome, Firefox or Safari.",
      unknown: "The microphone could not be started.",
    } satisfies Record<MicError, string>,
    fixTitle: "How to fix it",
    fixes: {
      denied: [
        "Tap the lock or “aA” icon in the address bar and allow the microphone.",
        "On iPhone: Settings › Safari › Microphone › Allow, then reload.",
        "If you opened this inside Instagram or another app, open it in Safari or Chrome instead.",
        "The page must be on https:// or localhost.",
      ],
      "not-found": [
        "Connect a headset or USB microphone.",
        "Check that the system has not disabled the microphone.",
      ],
      "in-use": [
        "Close video calls or recording apps.",
        "Close other tabs that use the microphone, then try again.",
      ],
      "insecure-context": [
        "Open the https:// address of this app.",
        "When running it yourself, use npm run dev or serve dist/ on localhost.",
      ],
      unsupported: ["Update your browser.", "Open the page outside in-app browsers."],
      unknown: ["Reload the page and try again.", "Restart the browser if it keeps failing."],
    } satisfies Record<MicError, string[]>,
    retry: "Try again",
    ringer:
      "Reference tones play through the speaker. On iPhone, switch the ringer off silent to hear them.",
  },

  settingsScreen: {
    a4: "A4 reference",
    a4Hint: "415–466 Hz · standard is 440",
    a4Down: "Decrease A4",
    a4Up: "Increase A4",
    window: "In-tune window",
    windowHint: "Green when within this many cents",
    names: "Note names",
    sharps: "Sharps ♯",
    flats: "Flats ♭",
    left: "Left-handed",
    leftHint: "Mirror the string buttons",
    theme: "Theme",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    advanced: "Advanced",
    bufferSize: "Analysis window",
    bufferHint: "Longer is steadier on low strings, slower",
    gate: "Noise gate",
    reset: "Reset to defaults",
  },

  helpScreen: {
    sections: [
      {
        title: "How to tune",
        steps: [
          "Pluck one open string near the sound hole and let it ring.",
          "Needle left means flat: tighten the peg. Right means sharp: loosen.",
          "Always finish by tuning up to the note. If you overshoot, go below and come back.",
          "Go round all four strings twice. Tuning one string moves the others a little.",
        ],
      },
      {
        title: "High G or low G?",
        body: "Standard tuning is G C E A with the G string higher than the C. That is normal: it is called re-entrant tuning. A low-G set uses a thicker string tuned an octave down. Never wind a low-G string up to high G; it will snap. Pick the matching tuning in Settings.",
      },
      {
        title: "Why does the needle jump?",
        body: "The first moment after a pluck is noisy. Wait half a second, play one string at a time, and move away from fans and hum. New strings keep stretching for a few days, so retune often.",
      },
      {
        title: "Microphone not working",
        body: "Allow the microphone in the address bar. On iPhone, tap Start again after returning to the app. The page needs https:// or localhost, and in-app browsers (Instagram, Facebook) often block the mic: open it in Safari or Chrome.",
      },
    ],
    privacy: (version: string) =>
      `Private by design: audio is analysed on your device and never uploaded. Version ${version}.`,
  },
} as const;
