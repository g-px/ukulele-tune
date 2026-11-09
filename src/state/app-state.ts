import type { MicError } from "../audio/mic-errors";
import type { GLook, UkeSize } from "../core/identify";
import type { GuideState } from "../core/guide";
import { EMPTY_READING, type TunerMode, type TunerReading } from "../core/tuner";
import type { StringNumber } from "../core/tunings";
import type { Settings } from "./settings";
import type { SetupState } from "./setup";

export type Screen = "start" | "tuner" | "settings" | "help" | "mic-error" | "setup";
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
  /** The beginner setup wizard, while it is open. */
  setup: SetupState | null;
  /** Guided tuning, while it runs on the tuner screen. */
  guide: GuideState | null;
  /** Show the "turn the other way" hint. */
  wrongWay: boolean;
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
    setup: null,
    guide: null,
    wrongWay: false,
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
  openSetup(): void;
  setupAnswer(patch: { size?: UkeSize; look?: GLook }): void;
  setupNext(): void;
  setupBack(): void;
  /** Leave the wizard from steps 1–3 (counts as onboarded). */
  setupSkip(): void;
  setupListenStart(): void;
  setupListenRestart(): void;
  setupListenSkip(): void;
  /** Save the result; "guide" starts guided tuning, "settings" opens Settings. */
  setupFinish(next: "guide" | "settings"): void;
  /** First-launch "I know my tuning" / "Tune by ear": mark onboarded and continue. */
  skipOnboarding(next: "mic" | "tones"): void;
  guideSkipString(): void;
  guideAgain(): void;
  guideExit(): void;
}
