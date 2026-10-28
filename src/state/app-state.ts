import type { MicError } from "../audio/mic-errors";
import { EMPTY_READING, type TunerMode, type TunerReading } from "../core/tuner";
import type { StringNumber } from "../core/tunings";
import type { Settings } from "./settings";

export type Screen = "start" | "tuner" | "settings" | "help" | "mic-error";
export type MicState = "idle" | "starting" | "running" | "off" | "error";

export interface AppState {
  screen: Screen;
  /** Where Back goes from Settings / Help. */
  returnTo: Screen;
  micState: MicState;
  micError: MicError | null;
  /** Every capture profile delivered exact zeros (mic path dead, not just quiet). */
  micSilent: boolean;
  mode: TunerMode;
  reading: TunerReading;
  tonePlaying: StringNumber | null;
  /** performance.now() of the last frame with a detected note, or of mic start. */
  lastNoteMs: number;
  nowMs: number;
  settings: Settings;
  /** Live audio-path summary, filled only with ?debug in the URL. */
  debugInfo: string;
}

export function initialState(settings: Settings): AppState {
  return {
    screen: "start",
    returnTo: "tuner",
    micState: "idle",
    micError: null,
    micSilent: false,
    mode: { kind: "auto" },
    reading: EMPTY_READING,
    tonePlaying: null,
    lastNoteMs: 0,
    nowMs: 0,
    settings,
    debugInfo: "",
  };
}

/** Everything the UI can ask for. Implemented by the engine in main.ts. */
export interface Actions {
  startMic(): void;
  startTonesOnly(): void;
  navigate(screen: Screen): void;
  back(): void;
  setMode(mode: TunerMode): void;
  toggleString(n: StringNumber): void;
  toggleTone(n: StringNumber): void;
  updateSettings(patch: Partial<Settings>): void;
  resetSettings(): void;
}
