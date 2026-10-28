import { midiToFreq } from "./pitch-math";

export type UkeSize = "soprano" | "concert" | "tenor" | "baritone";
export type StringNumber = 1 | 2 | 3 | 4;

export interface TuningString {
  /** 4 = string closest to the player's chin. */
  number: StringNumber;
  midi: number;
}

export interface Tuning {
  id: string;
  name: string;
  /** Lower-case first letter marks a re-entrant (high) 4th string. */
  short: string;
  reentrant: boolean;
  sizes: UkeSize[];
  description: string;
  /** Ordered 4, 3, 2, 1. */
  strings: TuningString[];
  /** Same intervals with the 4th string an octave away, if a preset exists. */
  octavePartnerId?: string;
}

function strings(m4: number, m3: number, m2: number, m1: number): TuningString[] {
  return [
    { number: 4, midi: m4 },
    { number: 3, midi: m3 },
    { number: 2, midi: m2 },
    { number: 1, midi: m1 },
  ];
}

const SCT: UkeSize[] = ["soprano", "concert", "tenor"];

export const TUNINGS: readonly Tuning[] = [
  {
    id: "c-high-g",
    name: "Standard C (high G)",
    short: "gCEA",
    reentrant: true,
    sizes: SCT,
    description: "The usual tuning for soprano, concert and tenor ukuleles.",
    strings: strings(67, 60, 64, 69),
    octavePartnerId: "c-low-g",
  },
  {
    id: "c-low-g",
    name: "Standard C (low G)",
    short: "GCEA",
    reentrant: false,
    sizes: ["concert", "tenor"],
    description: "Standard C with a thicker 4th string an octave lower.",
    strings: strings(55, 60, 64, 69),
    octavePartnerId: "c-high-g",
  },
  {
    id: "baritone",
    name: "Baritone",
    short: "DGBE",
    reentrant: false,
    sizes: ["baritone"],
    description: "Same as the top four strings of a guitar.",
    strings: strings(50, 55, 59, 64),
    octavePartnerId: "vintage-g",
  },
  {
    id: "d-high-a",
    name: "D tuning (high A)",
    short: "aDF#B",
    reentrant: true,
    sizes: ["soprano", "concert"],
    description: "Everything a whole step above C. Common in 1920s sheet music.",
    strings: strings(69, 62, 66, 71),
    octavePartnerId: "d-low-a",
  },
  {
    id: "d-low-a",
    name: "Canadian (low A)",
    short: "ADF#B",
    reentrant: false,
    sizes: ["concert", "tenor"],
    description: "D tuning with the 4th string an octave lower.",
    strings: strings(57, 62, 66, 71),
    octavePartnerId: "d-high-a",
  },
  {
    id: "slack-key",
    name: "Slack-key",
    short: "gCEG",
    reentrant: true,
    sizes: SCT,
    description: "Open strings form a C major chord.",
    strings: strings(67, 60, 64, 67),
  },
  {
    id: "bb",
    name: "B♭ tuning",
    short: "fB♭DG",
    reentrant: true,
    sizes: SCT,
    description: "Standard C lowered a whole step.",
    strings: strings(65, 58, 62, 67),
  },
  {
    id: "half-step-down",
    name: "Half-step down",
    short: "f#BD#G#",
    reentrant: true,
    sizes: SCT,
    description: "Standard C lowered a semitone.",
    strings: strings(66, 59, 63, 68),
  },
  {
    id: "vintage-g",
    name: "Vintage G",
    short: "dGBE",
    reentrant: true,
    sizes: ["tenor", "baritone"],
    description: "Baritone intervals with a high 4th string.",
    strings: strings(62, 55, 59, 64),
    octavePartnerId: "baritone",
  },
];

export const DEFAULT_TUNING_ID = "c-high-g";

export function findTuning(id: string): Tuning | undefined {
  return TUNINGS.find((t) => t.id === id);
}

export function getTuning(id: string): Tuning {
  const t = findTuning(id);
  if (!t) throw new Error(`Unknown tuning: ${id}`);
  return t;
}

export function stringFrequency(s: TuningString, a4: number): number {
  return midiToFreq(s.midi, a4);
}

export function tuningRange(t: Tuning, a4: number): { min: number; max: number } {
  const freqs = t.strings.map((s) => stringFrequency(s, a4));
  return { min: Math.min(...freqs), max: Math.max(...freqs) };
}
