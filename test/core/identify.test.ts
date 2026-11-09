import { describe, expect, it } from "vitest";
import {
  identify,
  listenVerdict,
  stringInterval,
  type GLook,
  type Identification,
  type UkeSize,
} from "../../src/core/identify";

type Row = [UkeSize, GLook, [number, number] | null, Identification];

const TABLE: Row[] = [
  ["concert", "thin", [389, 259], { tuningId: "c-high-g", basis: "listen", conflict: "none" }],
  ["concert", "unknown", [380, 270], { tuningId: "c-high-g", basis: "listen", conflict: "none" }],
  ["tenor", "thick", [196, 262], { tuningId: "c-low-g", basis: "listen", conflict: "none" }],
  [
    "tenor",
    "thin",
    [196, 262],
    { tuningId: "c-low-g", basis: "listen", conflict: "look-vs-listen" },
  ],
  [
    "soprano",
    "thick",
    [392, 262],
    { tuningId: "c-high-g", basis: "listen", conflict: "look-vs-listen" },
  ],
  ["unknown", "unknown", [147, 196], { tuningId: "baritone", basis: "listen", conflict: "none" }],
  ["unknown", "unknown", [190, 255], { tuningId: "c-low-g", basis: "listen", conflict: "none" }],
  ["baritone", "unknown", [150, 200], { tuningId: "baritone", basis: "size", conflict: "none" }],
  [
    "baritone",
    "unknown",
    [390, 260],
    { tuningId: "baritone", basis: "size", conflict: "size-vs-listen" },
  ],
  ["soprano", "unknown", [300, 290], { tuningId: "c-high-g", basis: "default", conflict: "none" }],
  ["soprano", "thick", null, { tuningId: "c-low-g", basis: "look", conflict: "none" }],
  ["unknown", "unknown", null, { tuningId: "c-high-g", basis: "default", conflict: "none" }],
];

describe("identify", () => {
  it.each(TABLE)("%s, %s, %j", (size, look, listen, expected) => {
    const sample = listen ? { string4Hz: listen[0], string3Hz: listen[1] } : null;
    expect(identify(size, look, sample)).toEqual(expected);
  });

  it("a thin-looking string with no clear listen result is high G by look", () => {
    expect(identify("tenor", "thin", null)).toEqual({
      tuningId: "c-high-g",
      basis: "look",
      conflict: "none",
    });
  });
});

describe("listen check", () => {
  it("measures the interval from string 3 to string 4 in semitones", () => {
    expect(stringInterval({ string4Hz: 392, string3Hz: 261.63 })).toBeCloseTo(7, 2);
    expect(stringInterval({ string4Hz: 196, string3Hz: 261.63 })).toBeCloseTo(-5, 2);
  });

  it("needs at least two semitones either way", () => {
    const at = (semitones: number) => ({ string4Hz: 262 * 2 ** (semitones / 12), string3Hz: 262 });
    expect(listenVerdict(at(2))).toBe("reentrant");
    expect(listenVerdict(at(1.99))).toBe("unclear");
    expect(listenVerdict(at(-1.99))).toBe("unclear");
    expect(listenVerdict(at(-2))).toBe("linear");
  });
});
