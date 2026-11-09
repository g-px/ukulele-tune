/** The beginner setup wizard as pure state transitions (beginner-setup.md §4.6). */
import {
  identify,
  listenVerdict,
  type GLook,
  type Identification,
  type ListenSample,
  type UkeSize,
} from "../core/identify";

export type SetupStep = "hold" | "size" | "look" | "listen" | "result";

export interface ListenState {
  string4Hz: number | null;
  string3Hz: number | null;
  /** The user skipped the check, or the microphone is unavailable. */
  skipped: boolean;
}

export interface SetupState {
  step: SetupStep;
  size: UkeSize | null;
  look: GLook | null;
  listen: ListenState;
}

const ORDER: readonly SetupStep[] = ["hold", "size", "look", "listen", "result"];

export const EMPTY_LISTEN: ListenState = { string4Hz: null, string3Hz: null, skipped: false };

export function startSetup(): SetupState {
  return { step: "hold", size: null, look: null, listen: EMPTY_LISTEN };
}

function skipsLook(s: SetupState): boolean {
  return s.size === "baritone";
}

export function nextStep(s: SetupState): SetupState {
  let i = ORDER.indexOf(s.step) + 1;
  if (ORDER[i] === "look" && skipsLook(s)) i++;
  const step = ORDER[Math.min(i, ORDER.length - 1)] ?? "result";
  return { ...s, step };
}

export function prevStep(s: SetupState): SetupState {
  let i = ORDER.indexOf(s.step) - 1;
  if (ORDER[i] === "look" && skipsLook(s)) i--;
  const step = ORDER[Math.max(i, 0)] ?? "hold";
  return { ...s, step };
}

/** Both strings heard. */
export function listenSample(l: ListenState): ListenSample | null {
  return l.string4Hz !== null && l.string3Hz !== null
    ? { string4Hz: l.string4Hz, string3Hz: l.string3Hz }
    : null;
}

/** Both strings heard but they sounded like the same note. */
export function listenSameNote(l: ListenState): boolean {
  const sample = listenSample(l);
  return sample !== null && listenVerdict(sample) === "unclear";
}

export function canGoNext(s: SetupState): boolean {
  switch (s.step) {
    case "size":
      return s.size !== null;
    case "look":
      return s.look !== null;
    case "listen":
      return s.listen.skipped || (listenSample(s.listen) !== null && !listenSameNote(s.listen));
    default:
      return true;
  }
}

/** Progress label: hold = 1 … listen = 4; result shows no step number. */
export function stepNumber(step: SetupStep): number {
  return Math.min(ORDER.indexOf(step) + 1, 4);
}

export function result(s: SetupState): Identification {
  const listen = s.listen.skipped ? null : listenSample(s.listen);
  return identify(s.size ?? "unknown", s.look ?? "unknown", listen);
}
