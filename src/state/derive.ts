/** Pure view-model functions: AppState -> what each widget shows. */
import { midiToFreq, noteName, prettyAccidentals } from "../core/pitch-math";
import { getTuning, type StringNumber } from "../core/tunings";
import { S } from "../strings";
import type { AppState } from "./app-state";

export const NO_SIGNAL_MS = 10_000;

export type Pill = "in" | "tighten" | "loosen" | null;

export interface NoteView {
  label: string;
  cents: string;
  pill: Pill;
  idle: boolean;
  stale: boolean;
}

function hasReading(st: AppState): boolean {
  return st.tonePlaying === null && (st.reading.status === "note" || st.reading.stale);
}

export function formatCents(cents: number): string {
  const r = Math.round(cents);
  if (r === 0) return "0 ¢";
  return `${r > 0 ? "+" : "−"}${Math.abs(r)} ¢`;
}

export function pillFor(st: AppState): Pill {
  if (!hasReading(st)) return null;
  if (st.reading.inTune) return "in";
  return st.reading.cents < 0 ? "tighten" : "loosen";
}

function stringNote(st: AppState, n: StringNumber): string {
  const tuning = getTuning(st.settings.tuningId);
  const str = tuning.strings.find((x) => x.number === n);
  return str ? noteName(str.midi, st.settings.flats).label : "";
}

export function noteView(st: AppState): NoteView {
  if (st.tonePlaying !== null) {
    return {
      label: prettyAccidentals(stringNote(st, st.tonePlaying)),
      cents: "",
      pill: null,
      idle: true,
      stale: false,
    };
  }
  if (hasReading(st)) {
    return {
      label: prettyAccidentals(st.reading.noteLabel),
      cents: formatCents(st.reading.cents),
      pill: pillFor(st),
      idle: false,
      stale: st.reading.stale,
    };
  }
  const label =
    st.mode.kind === "manual" ? prettyAccidentals(stringNote(st, st.mode.stringNumber)) : "—";
  return { label, cents: "", pill: null, idle: true, stale: false };
}

export function needleState(st: AppState): "idle" | "in" | "out" {
  const p = pillFor(st);
  return p === null ? "idle" : p === "in" ? "in" : "out";
}

export function needleLabel(st: AppState): string {
  if (!hasReading(st)) return "No note detected";
  const v = noteView(st);
  return `${v.label}, ${v.cents.replace("¢", "cents")}`;
}

function letterOf(label: string): string {
  return prettyAccidentals(label.replace(/-?\d+$/, ""));
}

export function statusMessage(st: AppState): string {
  if (st.micState === "starting") return S.status.starting;
  if (st.tonePlaying !== null) {
    return S.status.playingTone(prettyAccidentals(stringNote(st, st.tonePlaying)));
  }
  if (st.micState === "off") return S.status.micOff;
  if (st.micState !== "running") return "";
  const r = st.reading;
  if (hasReading(st)) {
    if (r.octaveHint !== "none" || st.mode.kind === "chromatic") return S.status.heard(r.frequency);
    const letter = letterOf(r.noteLabel);
    const pill = pillFor(st);
    if (pill === "in") return S.status.inTune(prettyAccidentals(r.noteLabel));
    return pill === "tighten" ? S.status.tighten(letter) : S.status.loosen(letter);
  }
  if (st.micSilent) return S.status.micSilent;
  return st.nowMs - st.lastNoteMs > NO_SIGNAL_MS ? S.status.noSignal : S.status.listening;
}

export function announcement(st: AppState): string {
  if (!hasReading(st) || st.reading.stale) return "";
  const pill = pillFor(st);
  const action = pill === "in" ? "in tune" : pill === "tighten" ? "tighten" : "loosen";
  return S.announce(prettyAccidentals(st.reading.noteLabel), st.reading.cents, action);
}

export interface StringView {
  number: StringNumber;
  letter: string;
  noteLabel: string;
  sub: string;
  hz: number;
  locked: boolean;
  current: boolean;
  warn: boolean;
  tone: boolean;
}

export function stringViews(st: AppState): StringView[] {
  const tuning = getTuning(st.settings.tuningId);
  const views = tuning.strings.map((str): StringView => {
    const name = noteName(str.midi, st.settings.flats);
    const hz = midiToFreq(str.midi, st.settings.a4);
    const isTarget = hasReading(st) && st.reading.stringNumber === str.number;
    const locked = st.mode.kind === "manual" && st.mode.stringNumber === str.number;
    const warn = isTarget && st.reading.octaveHint !== "none";
    return {
      number: str.number,
      letter: prettyAccidentals(name.letter),
      noteLabel: prettyAccidentals(name.label),
      sub: `${name.octave} · ${Math.round(hz)} Hz`,
      hz,
      locked,
      current: isTarget && !warn && !locked,
      warn,
      tone: st.tonePlaying === str.number,
    };
  });
  return st.settings.leftHanded ? views.reverse() : views;
}

export interface OctaveView {
  visible: boolean;
  title: string;
  body: string;
  switchLabel: string | null;
  switchTo: string | null;
}

export function octaveView(st: AppState): OctaveView {
  const r = st.reading;
  if (!hasReading(st) || r.octaveHint === "none") {
    return { visible: false, title: "", body: "", switchLabel: null, switchTo: null };
  }
  const note = prettyAccidentals(r.noteLabel);
  const low = r.octaveHint === "octave-low";
  const partner = r.partnerTuningId ? getTuning(r.partnerTuningId) : null;
  return {
    visible: true,
    title: low ? S.octave.low : S.octave.high,
    body: low ? S.octave.lowBody(note) : S.octave.highBody(note),
    switchLabel: partner ? S.octave.switchTo(partner.name) : null,
    switchTo: partner ? partner.id : null,
  };
}
