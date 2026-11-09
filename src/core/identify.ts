/**
 * Work out which common tuning a beginner's ukulele has from the setup
 * answers and an optional listen check (decision 16).
 */
import { DEFAULT_A4, freqToMidi } from "./pitch-math";

export type UkeSize = "soprano" | "concert" | "tenor" | "baritone" | "unknown";
export type GLook = "thin" | "thick" | "unknown";
export type ListenVerdict = "reentrant" | "linear" | "unclear";
export type Basis = "listen" | "look" | "size" | "default";
export type Conflict = "none" | "look-vs-listen" | "size-vs-listen";
export type IdentifiedTuning = "c-high-g" | "c-low-g" | "baritone";

export const UKE_SIZES: readonly UkeSize[] = ["soprano", "concert", "tenor", "baritone", "unknown"];

export interface ListenSample {
  string4Hz: number;
  string3Hz: number;
}

export interface Identification {
  tuningId: IdentifiedTuning;
  basis: Basis;
  conflict: Conflict;
}

/** Smallest interval, in semitones, that counts as a clear answer. */
const MIN_INTERVAL = 2;
/** MIDI boundaries halfway between baritone and low-G strings: D3|G3 for string 4, G3|C4 for string 3. */
const BARITONE_STRING4_BELOW = 52.5;
const BARITONE_STRING3_BELOW = 57.5;

/** Semitones from string 3 up to string 4: 12·log2(s4/s3). */
export function stringInterval(s: ListenSample): number {
  return 12 * Math.log2(s.string4Hz / s.string3Hz);
}

export function listenVerdict(s: ListenSample): ListenVerdict {
  // Rounded so a value that is +2 by construction is not lost to floating-point error.
  const interval = Math.round(stringInterval(s) * 1e6) / 1e6;
  if (interval >= MIN_INTERVAL) return "reentrant";
  if (interval <= -MIN_INTERVAL) return "linear";
  return "unclear";
}

/** Only meaningful when the size is unknown; detuning tolerance is about ±2.5 semitones. */
export function soundsBaritone(s: ListenSample): boolean {
  return (
    freqToMidi(s.string4Hz, DEFAULT_A4) < BARITONE_STRING4_BELOW &&
    freqToMidi(s.string3Hz, DEFAULT_A4) < BARITONE_STRING3_BELOW
  );
}

export function identify(size: UkeSize, look: GLook, listen: ListenSample | null): Identification {
  const verdict = listen ? listenVerdict(listen) : "unclear";
  if (size === "baritone") {
    return {
      tuningId: "baritone",
      basis: "size",
      conflict: verdict === "reentrant" ? "size-vs-listen" : "none",
    };
  }
  if (verdict === "reentrant") {
    return {
      tuningId: "c-high-g",
      basis: "listen",
      conflict: look === "thick" ? "look-vs-listen" : "none",
    };
  }
  if (verdict === "linear" && listen) {
    const baritone = size === "unknown" && soundsBaritone(listen);
    return {
      tuningId: baritone ? "baritone" : "c-low-g",
      basis: "listen",
      conflict: look === "thin" ? "look-vs-listen" : "none",
    };
  }
  if (look === "thick") return { tuningId: "c-low-g", basis: "look", conflict: "none" };
  if (look === "thin") return { tuningId: "c-high-g", basis: "look", conflict: "none" };
  return { tuningId: "c-high-g", basis: "default", conflict: "none" };
}
