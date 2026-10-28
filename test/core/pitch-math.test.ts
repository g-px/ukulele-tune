import { describe, expect, it } from "vitest";
import {
  centsBetween,
  centsToNearest,
  freqToMidi,
  midiToFreq,
  nearestMidi,
  noteName,
  prettyAccidentals,
} from "../../src/core/pitch-math";

describe("midiToFreq", () => {
  it("maps reference notes", () => {
    expect(midiToFreq(69)).toBe(440);
    expect(midiToFreq(60)).toBeCloseTo(261.6256, 3);
    expect(midiToFreq(55)).toBeCloseTo(196.0, 2);
    expect(midiToFreq(50)).toBeCloseTo(146.83, 2);
  });
  it("honours a custom A4", () => {
    expect(midiToFreq(69, 432)).toBe(432);
    expect(midiToFreq(81, 442)).toBeCloseTo(884, 6);
  });
});

describe("freqToMidi / nearestMidi", () => {
  it("inverts midiToFreq", () => {
    expect(freqToMidi(880)).toBeCloseTo(81, 10);
    expect(freqToMidi(midiToFreq(62.3))).toBeCloseTo(62.3, 10);
  });
  it("rounds to the nearest note", () => {
    expect(nearestMidi(392)).toBe(67);
    expect(nearestMidi(400)).toBe(67);
    expect(nearestMidi(410)).toBe(68);
  });
});

describe("cents", () => {
  it("centsBetween", () => {
    expect(centsBetween(453, 440)).toBeCloseTo(50.4, 1);
    expect(centsBetween(196, 392)).toBeCloseTo(-1200, 6);
    expect(centsBetween(440, 440)).toBe(0);
  });
  it("centsToNearest", () => {
    const r = centsToNearest(389.74);
    expect(r.midi).toBe(67);
    expect(r.cents).toBeCloseTo(-10, 1);
    const c = centsToNearest(264);
    expect(c.midi).toBe(60);
    expect(c.cents).toBeCloseTo(15.6, 1);
  });
  it("keeps the result in (-50, 50]", () => {
    const halfway = midiToFreq(69.5);
    const r = centsToNearest(halfway);
    expect(r.cents).toBeGreaterThan(-50);
    expect(r.cents).toBeLessThanOrEqual(50);
    expect(r.midi === 69 || r.midi === 70).toBe(true);
    const below = centsToNearest(midiToFreq(68.5));
    expect(below.cents).toBeGreaterThan(-50);
  });
});

describe("noteName", () => {
  it("names notes with octave", () => {
    expect(noteName(60).label).toBe("C4");
    expect(noteName(59).label).toBe("B3");
    expect(noteName(69)).toEqual({ letter: "A", octave: 4, label: "A4" });
    expect(noteName(61, true).label).toBe("Db4");
    expect(noteName(66).label).toBe("F#4");
  });
  it("handles negative midi numbers", () => {
    expect(noteName(-1).label).toBe("B-2");
  });
  it("prettyAccidentals", () => {
    expect(prettyAccidentals("F#4")).toBe("F♯4");
    expect(prettyAccidentals("Bb3")).toBe("B♭3");
    expect(prettyAccidentals("E4")).toBe("E4");
  });
});
