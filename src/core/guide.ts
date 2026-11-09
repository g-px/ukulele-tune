/** Guided tuning: strings 4 → 1, twice round, advancing after a steady in-tune hold (decision 18). */
import type { StringNumber } from "./tunings";

export const GUIDE_ORDER: readonly StringNumber[] = [4, 3, 2, 1];

export interface GuideState {
  index: number;
  round: 1 | 2;
  inTuneSinceMs: number | null;
  done: boolean;
}

export interface GuideFrame {
  stringNumber: StringNumber | null;
  inTune: boolean;
  timeMs: number;
}

export function startGuide(): GuideState {
  return { index: 0, round: 1, inTuneSinceMs: null, done: false };
}

export function currentString(s: GuideState): StringNumber | null {
  return s.done ? null : (GUIDE_ORDER[s.index] ?? null);
}

/** Move to the next string, the second round, or done. */
export function skipGuideString(s: GuideState): GuideState {
  if (s.done) return s;
  if (s.index + 1 < GUIDE_ORDER.length) return { ...s, index: s.index + 1, inTuneSinceMs: null };
  if (s.round === 1) return { index: 0, round: 2, inTuneSinceMs: null, done: false };
  return { ...s, inTuneSinceMs: null, done: true };
}

export function stepGuide(s: GuideState, f: GuideFrame, holdMs: number): GuideState {
  if (s.done) return s;
  const onTarget = f.inTune && f.stringNumber === currentString(s);
  if (!onTarget) return s.inTuneSinceMs === null ? s : { ...s, inTuneSinceMs: null };
  if (s.inTuneSinceMs === null) return { ...s, inTuneSinceMs: f.timeMs };
  return f.timeMs - s.inTuneSinceMs >= holdMs ? skipGuideString(s) : s;
}
