/** English copy; the reference every other locale is typed against. */
import type { MicError } from "../audio/mic-errors";
import type { IdentifiedTuning } from "../core/identify";

export const en = {
  appName: "Ukulele Tune",
  help: "Help",
  settings: "Settings",
  back: "Back to tuner",
  tuning: "Tuning",

  tuningNames: {
    "c-high-g": "Standard C (high G)",
    "c-low-g": "Standard C (low G)",
    baritone: "Baritone",
    "d-high-a": "D tuning (high A)",
    "d-low-a": "Canadian (low A)",
    "slack-key": "Slack-key",
    bb: "B♭ tuning",
    "half-step-down": "Half-step down",
    "vintage-g": "Vintage G",
  } as Record<string, string>,

  a11y: {
    tuner: "Tuner",
    mode: "Mode",
    strings: "Strings",
    micLevel: "Microphone level",
    noNote: "No note detected",
    cents: "cents",
    language: "Language",
  },

  start: {
    instruction: "Tap start, allow the microphone, then pluck one string at a time.",
    startTuner: "Start tuner",
    tonesOnly: "Tune by ear with reference tones",
    privacy: "Audio never leaves your device. Everything runs in your browser and works offline.",
    firstLead:
      "New to the ukulele? We will find out which one you have and tune it with you, step by step.",
    setup: "Set up my ukulele",
    setupSub: "About 1 minute",
    knowTuning: "I know my tuning · Start tuner",
    setupLink: "New to the ukulele? Set up my ukulele",
  },

  /** Show solfège (Dó Ré Mi) next to letter names in guidance text. */
  showSolfege: false,

  setup: {
    label: "Set up my ukulele",
    step: (n: number) => `Step ${n} of 4`,
    skip: "Skip",
    next: "Next",
    back: "Back",
    hold: {
      title: "Hold it like this",
      face: "↑ Toward your face",
      floor: "↓ Toward the floor",
      b1: "Neck to your left, strings facing out. Strum over the sound hole with your right hand.",
      b1Left:
        "Neck to your right, strings facing out. Strum over the sound hole with your left hand.",
      b2: "String 4 is the one closest to your face. String 1 is closest to the floor.",
      b3: "Each string ends at one peg on the head. Run a finger along it to find its peg.",
      lefty: "I play left-handed",
      leftySub: "Neck to your right; the drawing flips",
      drawing:
        "Ukulele as you hold it: string 4 at the top nearest your face, string 1 at the bottom nearest the floor",
      head: "Head and pegs",
      strum: "Strum here",
    },
    size: {
      title: "How big is it?",
      lead: "Measure from the top of the head to the bottom of the body.",
      group: "Ukulele size",
      names: {
        soprano: "Soprano",
        concert: "Concert",
        tenor: "Tenor",
        baritone: "Baritone",
      },
      length: (cm: number, inches: number) => `About ${cm} cm · ${inches} in`,
      unsure: "Not sure · let the app listen",
      info: "Soprano, concert and tenor all tune the same: G C E A. Only baritone is different. The size is often on a label inside the sound hole.",
    },
    look: {
      title: "Look at string 4",
      lead: "The one closest to your face. Compare it with string 3, right next to it.",
      group: "String 4 compared with string 3",
      thin: "Thinner than string 3",
      thinTag: "High G · most common",
      thick: "Thicker than string 3",
      thickSub: "Often metal-wound, like a guitar string",
      thickTag: "Low G",
      unsure: "Can't tell · let the app listen",
      warn: "This matters: a low-G string tuned up to high G will snap, and a high-G string tuned down goes floppy.",
    },
    listen: {
      title: "Let the app listen",
      lead: "Pluck string 4, then string 3. One at a time, and let each ring.",
      start: "Start listening",
      string: (n: number) => `String ${n}`,
      heard: "Heard",
      now: "Pluck it now…",
      waiting: "Next",
      info: "On a high-G ukulele string 4 sounds higher than string 3. On low-G and baritone it sounds lower. This works even if it is out of tune.",
      same: "Those two sounded the same. Pluck string 4, then the string next to it (string 3).",
      noMic: "The microphone is off, so this check is skipped. Your answers will be used.",
      restart: "Start over",
      privacy: "Uses the microphone. Nothing is recorded or uploaded.",
      drawing: (n: number) => `Strings 4 to 1; string ${n} is highlighted`,
    },
    result: {
      title: "Your ukulele",
      found: "Found it",
      check: "Check this",
      headline: (size: string, tuning: IdentifiedTuning) =>
        tuning === "baritone"
          ? "Baritone"
          : `${size ? `${size} · ` : ""}${tuning === "c-high-g" ? (size ? "high G" : "High G") : size ? "low G" : "Low G"}`,
      tuningLine: (name: string) => `${name} ·`,
      why: {
        listenLook: (high: boolean) =>
          high
            ? "String 4 sounded higher than string 3, and you said it looks thinner. Both mean high G."
            : "String 4 sounded lower than string 3, and you said it looks thicker. Both mean low G.",
        listen: (high: boolean) =>
          high
            ? "String 4 sounded higher than string 3. That means high G."
            : "String 4 sounded lower than string 3. That means low G.",
        listenBaritone:
          "String 4 sounded lower than string 3, and both sounded low. That is a baritone.",
        look: (high: boolean) =>
          high
            ? "You said string 4 is thinner than string 3. That means high G."
            : "You said string 4 is thicker than string 3. That means low G.",
        size: "Baritone ukuleles are tuned D G B E, like the top four guitar strings.",
        default:
          "Most ukuleles are high G, so we picked it. If a string sounds an octave off, the tuner will warn you.",
        conflict:
          "What you saw and what we heard do not match. Pluck strings 4 and 3 again, or check which string is closest to your face.",
      },
      mapLabel: "Strings and their notes",
      face: "Closest to your face",
      floor: "Closest to the floor",
      lowest: "Lowest note",
      tip1: "Tighten a peg to raise the note, loosen it to lower the note.",
      tip2: "Turn a little, pluck again. If the needle moves the wrong way, turn the other way.",
      guide: "Tune it with me",
      manual: "Not right? Pick the tuning myself",
      again: "Listen again",
    },
  },

  guide: {
    title: "Guided tuning",
    round: (n: number) => `Round ${n} of 2`,
    step: (n: number) => `Step ${n} of 4`,
    string: (n: number, letter: string) => `String ${n} · ${letter}`,
    hint4: "Closest to your face. Follow it to its peg, pluck it, and turn the peg slowly.",
    hint1: "Closest to the floor. Follow it to its peg, pluck it, and turn the peg slowly.",
    hintMid: "Follow it to its peg, pluck it, and turn the peg slowly.",
    wrongWayStrong: "Getting further away.",
    wrongWay: (letter: string) => `Turn the ${letter} peg the other way.`,
    footer: "Hold it in the green for a second and we move on.",
    skip: "Skip string",
    next: "Next",
    tileString: (n: number) => `String ${n}`,
    done: "All four strings are in tune.",
    doneBody: "Strings stretch, so check again after a few minutes of playing.",
    again: "Go round again",
    finish: "Done",
    leave: "Leave guided tuning",
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
    micSilent:
      "The microphone is sending silence. Close other apps using it (calls, recorders), then reload the page.",
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

  announce: (note: string, cents: number, action: "in" | "tighten" | "loosen") =>
    cents === 0 || action === "in"
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
    language: "Language",
    languageAuto: "Auto",
    findMine: "Not sure? Find my ukulele",
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
    which: "Which ukulele do I have?",
    whichBody: "A one-minute check finds your tuning: size, string 4, and a quick listen.",
    privacy: (version: string) =>
      `Private by design: audio is analysed on your device and never uploaded. Version ${version}.`,
  },
} as const;
