import {
  A4_DEFAULT,
  A4_MAX,
  A4_MIN,
  BUFFER_SIZES,
  DEFAULT_BUFFER_SIZE,
  DEFAULT_GATE_DBFS,
  GATE_MAX_DBFS,
  GATE_MIN_DBFS,
  type BufferSize,
} from "../config";
import { UKE_SIZES, type UkeSize } from "../core/identify";
import { DEFAULT_TUNING_ID, findTuning } from "../core/tunings";
import { LANGUAGE_PREFS, type LanguagePref } from "./locale";

export type Theme = "system" | "light" | "dark";

export interface Settings {
  tuningId: string;
  a4: number;
  inTuneCents: 3 | 5;
  flats: boolean;
  leftHanded: boolean;
  theme: Theme;
  bufferSize: BufferSize;
  gateDbfs: number;
  language: LanguagePref;
  /** The first-launch screen has been answered or skipped. */
  onboarded: boolean;
  ukuleleSize: UkeSize;
}

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  tuningId: DEFAULT_TUNING_ID,
  a4: A4_DEFAULT,
  inTuneCents: 5,
  flats: false,
  leftHanded: false,
  theme: "system",
  bufferSize: DEFAULT_BUFFER_SIZE,
  gateDbfs: DEFAULT_GATE_DBFS,
  language: "auto",
  onboarded: false,
  ukuleleSize: "unknown",
};

export const STORAGE_KEY = "ukulele-tune.settings.v1";

/** Minimal Storage surface so tests can pass a fake. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v)
    ? Math.min(max, Math.max(min, Math.round(v)))
    : fallback;
}

/** Turn anything (parsed JSON, partial objects) into valid Settings. */
export function sanitizeSettings(raw: unknown): Settings {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;
  return {
    tuningId: typeof r.tuningId === "string" && findTuning(r.tuningId) ? r.tuningId : d.tuningId,
    a4: clampInt(r.a4, A4_MIN, A4_MAX, d.a4),
    inTuneCents: r.inTuneCents === 3 || r.inTuneCents === 5 ? r.inTuneCents : d.inTuneCents,
    flats: typeof r.flats === "boolean" ? r.flats : d.flats,
    leftHanded: typeof r.leftHanded === "boolean" ? r.leftHanded : d.leftHanded,
    theme: r.theme === "light" || r.theme === "dark" || r.theme === "system" ? r.theme : d.theme,
    bufferSize: BUFFER_SIZES.includes(r.bufferSize as BufferSize)
      ? (r.bufferSize as BufferSize)
      : d.bufferSize,
    gateDbfs: clampInt(r.gateDbfs, GATE_MIN_DBFS, GATE_MAX_DBFS, d.gateDbfs),
    language: LANGUAGE_PREFS.includes(r.language as LanguagePref)
      ? (r.language as LanguagePref)
      : d.language,
    onboarded: typeof r.onboarded === "boolean" ? r.onboarded : d.onboarded,
    ukuleleSize: UKE_SIZES.includes(r.ukuleleSize as UkeSize)
      ? (r.ukuleleSize as UkeSize)
      : d.ukuleleSize,
  };
}

export function loadSettings(storage: KeyValueStorage | null): Settings {
  try {
    const text = storage?.getItem(STORAGE_KEY);
    const raw: unknown = text ? JSON.parse(text) : {};
    const settings = sanitizeSettings(raw);
    // Settings saved before the beginner setup existed belong to a returning user.
    const isObject = typeof raw === "object" && raw !== null;
    if (text && isObject && !("onboarded" in raw)) settings.onboarded = true;
    return settings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(storage: KeyValueStorage | null, s: Settings): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Private mode or quota: settings simply do not persist.
  }
}

/** localStorage if the browser lets us touch it. */
export function browserStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}
