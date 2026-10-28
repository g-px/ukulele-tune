import { centsBetween } from "./pitch-math";
import { stringFrequency, type Tuning, type TuningString } from "./tunings";

export type OctaveHint = "none" | "octave-low" | "octave-high";

export interface StringMatch {
  string: TuningString;
  targetHz: number;
  cents: number;
  octaveHint: OctaveHint;
  /** Preset whose 4th string is an octave away and matches, when the hint is on string 4. */
  partnerTuningId?: string;
}

/** A string further than this from every target may be an octave off. */
const OCTAVE_SEARCH_CENTS = 100;
/** How close to an exact octave a pitch must be to count as an octave error. */
const OCTAVE_TOLERANCE_CENTS = 50;

export function matchString(freq: number, s: TuningString, a4: number): StringMatch {
  const targetHz = stringFrequency(s, a4);
  const cents = centsBetween(freq, targetHz);
  let octaveHint: OctaveHint = "none";
  if (Math.abs(cents + 1200) <= OCTAVE_TOLERANCE_CENTS) octaveHint = "octave-low";
  else if (Math.abs(cents - 1200) <= OCTAVE_TOLERANCE_CENTS) octaveHint = "octave-high";
  return { string: s, targetHz, cents, octaveHint };
}

/**
 * The string the player is most likely tuning. Normally the nearest target
 * in cents; when nothing is close, a string sounding an octave from its
 * target wins (the classic high-G / low-G mix-up).
 */
export function nearestString(freq: number, tuning: Tuning, a4: number): StringMatch {
  const matches = tuning.strings.map((s) => matchString(freq, s, a4));
  let best = matches[0] as StringMatch;
  for (const m of matches) if (Math.abs(m.cents) < Math.abs(best.cents)) best = m;
  if (Math.abs(best.cents) <= OCTAVE_SEARCH_CENTS) return { ...best, octaveHint: "none" };

  const octave = matches.find((m) => m.octaveHint !== "none");
  if (!octave) return { ...best, octaveHint: "none" };
  const result: StringMatch = { ...octave };
  if (octave.string.number === 4 && tuning.octavePartnerId) {
    result.partnerTuningId = tuning.octavePartnerId;
  }
  return result;
}
