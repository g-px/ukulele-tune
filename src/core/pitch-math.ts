/** Equal-temperament pitch maths. All functions are pure. */

export const DEFAULT_A4 = 440;

export const SHARP_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export const FLAT_NAMES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

export interface NoteName {
  letter: string;
  octave: number;
  label: string;
}

/** Frequency in Hz of a (possibly fractional) MIDI note number. */
export function midiToFreq(midi: number, a4 = DEFAULT_A4): number {
  return a4 * 2 ** ((midi - 69) / 12);
}

/** Fractional MIDI note number of a frequency. */
export function freqToMidi(freq: number, a4 = DEFAULT_A4): number {
  return 69 + 12 * Math.log2(freq / a4);
}

export function nearestMidi(freq: number, a4 = DEFAULT_A4): number {
  return Math.round(freqToMidi(freq, a4));
}

/** Signed distance in cents from refFreq to freq. */
export function centsBetween(freq: number, refFreq: number): number {
  return 1200 * Math.log2(freq / refFreq);
}

/** Nearest semitone and the offset to it in cents, in (-50, 50]. */
export function centsToNearest(freq: number, a4 = DEFAULT_A4): { midi: number; cents: number } {
  const exact = freqToMidi(freq, a4);
  let midi = Math.round(exact);
  let cents = (exact - midi) * 100;
  // Math.round rounds .5 up, which gives -50; move it to +50 for a half-open range.
  if (cents <= -50) {
    midi -= 1;
    cents += 100;
  }
  return { midi, cents };
}

export function noteName(midi: number, flats = false): NoteName {
  const names = flats ? FLAT_NAMES : SHARP_NAMES;
  const pitchClass = ((midi % 12) + 12) % 12;
  const letter = names[pitchClass] ?? "?";
  const octave = Math.floor(midi / 12) - 1;
  return { letter, octave, label: `${letter}${octave}` };
}

/** Display form with real sharp/flat symbols. */
export function prettyAccidentals(label: string): string {
  return label.replace("#", "♯").replace(/([A-G])b/, "$1♭");
}
