import { describe, expect, it } from "vitest";
import { EMPTY_READING, type TunerReading } from "../../src/core/tuner";
import { initialState, type AppState } from "../../src/state/app-state";
import {
  announcement,
  formatCents,
  needleLabel,
  needleState,
  noteView,
  octaveView,
  statusMessage,
  stringViews,
} from "../../src/state/derive";
import { DEFAULT_SETTINGS } from "../../src/state/settings";

function state(patch: Partial<AppState> = {}, reading: Partial<TunerReading> = {}): AppState {
  return {
    ...initialState({ ...DEFAULT_SETTINGS }),
    micState: "running",
    screen: "tuner",
    ...patch,
    reading: { ...EMPTY_READING, ...reading },
  };
}

const IN_TUNE: Partial<TunerReading> = {
  status: "note",
  frequency: 392.2,
  noteLabel: "G4",
  targetHz: 392,
  cents: 1,
  direction: "in-tune",
  inTune: true,
  stringNumber: 4,
};
const FLAT_E: Partial<TunerReading> = {
  status: "note",
  frequency: 325,
  noteLabel: "E4",
  cents: -23,
  direction: "flat",
  stringNumber: 2,
};

describe("formatCents", () => {
  it("signs and rounds", () => {
    expect(formatCents(1.2)).toBe("+1 ¢");
    expect(formatCents(-23.4)).toBe("−23 ¢");
    expect(formatCents(0.3)).toBe("0 ¢");
  });
});

describe("noteView / needle", () => {
  it("in tune (artboard 2)", () => {
    const st = state({}, IN_TUNE);
    expect(noteView(st)).toEqual({
      label: "G4",
      cents: "+1 ¢",
      pill: "in",
      idle: false,
      stale: false,
    });
    expect(needleState(st)).toBe("in");
    expect(needleLabel(st)).toBe("G4, +1 cents");
  });

  it("flat with manual lock (artboard 3)", () => {
    const st = state({ mode: { kind: "manual", stringNumber: 2 } }, FLAT_E);
    expect(noteView(st).pill).toBe("tighten");
    expect(needleState(st)).toBe("out");
    expect(statusMessage(st)).toContain("Turn the E peg to raise the pitch");
  });

  it("sharp says loosen", () => {
    const st = state({}, { ...FLAT_E, cents: 12, direction: "sharp" });
    expect(noteView(st).pill).toBe("loosen");
    expect(statusMessage(st)).toContain("lower the pitch");
  });

  it("within the window but not yet held is not green", () => {
    const st = state({}, { ...IN_TUNE, inTune: false, cents: -2 });
    expect(noteView(st).pill).toBe("tighten");
  });

  it("idle shows a dash, or the locked string", () => {
    expect(noteView(state()).label).toBe("—");
    expect(noteView(state()).idle).toBe(true);
    expect(needleState(state())).toBe("idle");
    expect(needleLabel(state())).toBe("No note detected");
    expect(noteView(state({ mode: { kind: "manual", stringNumber: 3 } })).label).toBe("C4");
  });

  it("tone playing shows the tone note and idles the needle", () => {
    const st = state({ tonePlaying: 1 }, IN_TUNE);
    expect(noteView(st).label).toBe("A4");
    expect(needleState(st)).toBe("idle");
    expect(statusMessage(st)).toBe("Playing A4 reference tone");
  });

  it("stale readings are flagged", () => {
    expect(noteView(state({}, { ...IN_TUNE, status: "silent", stale: true })).stale).toBe(true);
  });
});

describe("statusMessage", () => {
  it("covers mic states", () => {
    expect(statusMessage(state({ micState: "starting" }))).toBe("Starting microphone…");
    expect(statusMessage(state({ micState: "off" }))).toMatch(/tones only/);
    expect(statusMessage(state({ micState: "idle" }))).toBe("");
  });
  it("listening, then no-signal hint after 10 s", () => {
    expect(statusMessage(state({ nowMs: 5000, lastNoteMs: 0 }))).toMatch(/^Listening/);
    expect(statusMessage(state({ nowMs: 10_001, lastNoteMs: 0 }))).toMatch(/^Nothing heard/);
  });
  it("in tune and chromatic", () => {
    expect(statusMessage(state({}, IN_TUNE))).toBe("G4 is in tune. Pluck the next string.");
    expect(statusMessage(state({ mode: { kind: "chromatic" } }, IN_TUNE))).toBe("Heard 392 Hz");
  });
});

describe("octave hint (artboard 4)", () => {
  const hint: Partial<TunerReading> = {
    status: "note",
    frequency: 196,
    noteLabel: "G4",
    cents: -1198,
    direction: "flat",
    stringNumber: 4,
    octaveHint: "octave-low",
    partnerTuningId: "c-low-g",
  };
  it("shows the card with a switch button", () => {
    const v = octaveView(state({}, hint));
    expect(v.visible).toBe(true);
    expect(v.title).toBe("Sounds an octave low.");
    expect(v.body).toContain("G4");
    expect(v.switchLabel).toBe("Switch to Standard C (low G)");
    expect(v.switchTo).toBe("c-low-g");
    expect(statusMessage(state({}, hint))).toBe("Heard 196 Hz");
  });
  it("high hint without partner", () => {
    const v = octaveView(
      state({}, { ...hint, octaveHint: "octave-high", partnerTuningId: undefined }),
    );
    expect(v.title).toBe("Sounds an octave high.");
    expect(v.switchLabel).toBeNull();
  });
  it("hidden without a hint", () => {
    expect(octaveView(state({}, IN_TUNE)).visible).toBe(false);
  });
  it("string 4 is marked as warning, not current", () => {
    const g = stringViews(state({}, hint)).find((v) => v.number === 4);
    expect(g?.warn).toBe(true);
    expect(g?.current).toBe(false);
  });
});

describe("stringViews", () => {
  it("lists G C E A with Hz, honouring A4 and left-handed", () => {
    const v = stringViews(state({}, IN_TUNE));
    expect(v.map((x) => x.letter)).toEqual(["G", "C", "E", "A"]);
    expect(v[0]?.sub).toBe("4 · 392 Hz");
    expect(v[0]?.current).toBe(true);
    const lefty = stringViews(
      state({ settings: { ...DEFAULT_SETTINGS, leftHanded: true, a4: 442 } }),
    );
    expect(lefty.map((x) => x.letter)).toEqual(["A", "E", "C", "G"]);
    expect(lefty[0]?.sub).toBe("4 · 442 Hz");
  });
  it("marks locked and tone strings", () => {
    const v = stringViews(state({ mode: { kind: "manual", stringNumber: 2 }, tonePlaying: 3 }));
    expect(v.find((x) => x.number === 2)?.locked).toBe(true);
    expect(v.find((x) => x.number === 3)?.tone).toBe(true);
  });
  it("uses flats and accidentals", () => {
    const v = stringViews(
      state({ settings: { ...DEFAULT_SETTINGS, tuningId: "bb", flats: true } }),
    );
    expect(v.map((x) => x.noteLabel)).toEqual(["F4", "B♭3", "D4", "G4"]);
  });
});

describe("announcement", () => {
  it("speaks note, cents and action", () => {
    expect(announcement(state({}, FLAT_E))).toBe("E4, 23 cents flat, tighten");
    expect(announcement(state({}, IN_TUNE))).toBe("G4, in tune");
    expect(announcement(state())).toBe("");
  });
});
