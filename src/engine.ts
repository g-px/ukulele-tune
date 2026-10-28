/**
 * Connects audio to state: owns the AudioContext, mic session, detector,
 * tuner and tone player, runs the per-frame loop and implements Actions.
 */
import { audioContextSupported, closeAudioContext, ensureAudioContext } from "./audio/context";
import { classifyMicError, micEnvironmentError } from "./audio/mic-errors";
import {
  createMicSession,
  requestMicStream,
  streamSampleRate,
  type CaptureProfile,
  type MicSession,
} from "./audio/mic";
import { createTonePlayer, type TonePlayer } from "./audio/tone";
import {
  ATTACK_JUMP_DB,
  ATTACK_SKIP_MS,
  CLARITY_THRESHOLD,
  EMA_ALPHA,
  HIGHPASS_HZ,
  HOLD_MS,
  IN_TUNE_HOLD_FRAMES,
  LOWPASS_HZ,
  MAX_FREQ,
  MEDIAN_SIZE,
  MIN_FREQ,
} from "./config";
import { createPitchDetector, type PitchDetector } from "./core/mpm";
import { midiToFreq } from "./core/pitch-math";
import { dbfs, peak, rms } from "./core/signal";
import { EMPTY_READING, createTuner, type TunerConfig, type TunerMode } from "./core/tuner";
import { getTuning, type StringNumber } from "./core/tunings";
import type { Actions, AppState, Screen } from "./state/app-state";
import {
  DEFAULT_SETTINGS,
  saveSettings,
  sanitizeSettings,
  type KeyValueStorage,
  type Settings,
} from "./state/settings";
import type { Store } from "./state/store";

/** Tried in order while the mic delivers only exact zeros (seen on iOS Safari). */
const CAPTURE_PROFILES: readonly CaptureProfile[] = ["raw", "plain"];
/** About 1.5 s of frames of exact digital silence before trying the next profile. */
const DEAD_FRAMES = 90;
const DEBUG = typeof location !== "undefined" && new URLSearchParams(location.search).has("debug");

function tunerConfig(settings: Settings, mode: TunerMode): TunerConfig {
  return {
    a4: settings.a4,
    tuning: getTuning(settings.tuningId),
    mode,
    flats: settings.flats,
    inTuneCents: settings.inTuneCents,
    clarityThreshold: CLARITY_THRESHOLD,
    gateDbfs: settings.gateDbfs,
    medianSize: MEDIAN_SIZE,
    emaAlpha: EMA_ALPHA,
    inTuneHoldFrames: IN_TUNE_HOLD_FRAMES,
    holdMs: HOLD_MS,
    attackSkipMs: ATTACK_SKIP_MS,
    attackJumpDb: ATTACK_JUMP_DB,
  };
}

export function createEngine(store: Store<AppState>, storage: KeyValueStorage | null): Actions {
  let ctx: AudioContext | null = null;
  let mic: MicSession | null = null;
  let detector: PitchDetector | null = null;
  let buffer = new Float32Array(0);
  let tone: TonePlayer | null = null;
  let toneCtx: AudioContext | null = null;
  let raf = 0;
  let attempt = 0;
  let deadFrames = 0;
  let frameCount = 0;
  let resumeOnVisible = false;
  const tuner = createTuner(tunerConfig(store.get().settings, store.get().mode));

  function buildDetector(): void {
    if (!mic) return;
    const size = store.get().settings.bufferSize;
    mic.setBufferSize(size);
    buffer = new Float32Array(size);
    detector = createPitchDetector({
      sampleRate: mic.sampleRate,
      bufferSize: size,
      minFrequency: MIN_FREQ,
      maxFrequency: MAX_FREQ,
    });
  }

  function frame(): void {
    raf = requestAnimationFrame(frame);
    const now = performance.now();
    const st = store.get();
    if (!mic || !detector || st.tonePlaying !== null) {
      store.set({ nowMs: now });
      return;
    }
    mic.read(buffer);
    frameCount++;
    const level = dbfs(rms(buffer));
    if (watchForDeadInput(peak(buffer))) return;
    const pitch =
      level >= st.settings.gateDbfs ? detector.detect(buffer) : { frequency: 0, clarity: 0 };
    const reading = tuner.process({ ...pitch, rmsDbfs: level, timeMs: now });
    if (reading.inTune && !st.reading.inTune) navigator.vibrate?.(30);
    store.set({
      reading,
      nowMs: now,
      lastNoteMs: reading.status === "note" ? now : st.lastNoteMs,
      ...(DEBUG && frameCount % 15 === 0 ? { debugInfo: debugLine(level) } : {}),
    });
  }

  /** Returns true when it has started a restart and the frame should end. */
  function watchForDeadInput(samplePeak: number): boolean {
    if (samplePeak > 0) {
      deadFrames = 0;
      return false;
    }
    deadFrames++;
    if (deadFrames === DEAD_FRAMES / 2 && ctx && ctx.state !== "running") {
      ctx.resume().catch(() => undefined);
    }
    if (deadFrames < DEAD_FRAMES) return false;
    deadFrames = 0;
    if (attempt + 1 < CAPTURE_PROFILES.length) {
      console.warn(
        "[ukulele-tune] mic delivers silence; retrying with",
        CAPTURE_PROFILES[attempt + 1],
      );
      void beginMic(attempt + 1);
      return true;
    }
    if (!store.get().micSilent) store.set({ micSilent: true });
    return false;
  }

  function debugLine(level: number): string {
    const lvl = Number.isFinite(level) ? `${level.toFixed(1)} dBFS` : "silence";
    return [
      `build ${__BUILD__} · profile ${CAPTURE_PROFILES[attempt] ?? "?"}`,
      mic?.describe() ?? "no mic",
      `level ${lvl} · frames ${frameCount}`,
      navigator.userAgent,
    ].join("\n");
  }

  function startLoop(): void {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function stopMicSession(): void {
    mic?.stop();
    mic = null;
    detector = null;
  }

  async function beginMic(profileIndex = 0): Promise<void> {
    const envError = micEnvironmentError({
      isSecureContext: window.isSecureContext,
      hasGetUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
      hasAudioContext: audioContextSupported(),
    });
    if (envError) {
      store.set({ micState: "error", micError: envError, screen: "mic-error" });
      return;
    }
    store.set({ micState: "starting", micSilent: false });
    let stream: MediaStream | null = null;
    try {
      stopMicSession();
      attempt = profileIndex;
      deadFrames = 0;
      if (profileIndex > 0) closeAudioContext();
      stream = await requestMicStream(CAPTURE_PROFILES[profileIndex] ?? "plain");
      ctx = await ensureAudioContext(streamSampleRate(stream));
      watchContext(ctx);
      mic = createMicSession(ctx, stream, {
        bufferSize: store.get().settings.bufferSize,
        highpassHz: HIGHPASS_HZ,
        lowpassHz: LOWPASS_HZ,
      });
      buildDetector();
      tuner.reset();
      const now = performance.now();
      store.set({
        micState: "running",
        micError: null,
        screen: "tuner",
        lastNoteMs: now,
        nowMs: now,
        reading: EMPTY_READING,
      });
      startLoop();
    } catch (e) {
      console.warn("[ukulele-tune] microphone failed", e);
      if (!mic) for (const t of stream?.getTracks() ?? []) t.stop();
      stopMicSession();
      store.set({ micState: "error", micError: classifyMicError(e), screen: "mic-error" });
    }
  }

  const watched = new WeakSet<AudioContext>();
  /** iOS suspends ("interrupted") the context on calls, Siri or route changes; resume it. */
  function watchContext(c: AudioContext): void {
    if (watched.has(c)) return;
    watched.add(c);
    c.addEventListener("statechange", () => {
      if (c.state !== "running" && c.state !== "closed" && mic && !document.hidden) {
        c.resume().catch(() => undefined);
      }
    });
  }

  function stopTone(): void {
    tone?.stop();
    if (store.get().tonePlaying !== null) store.set({ tonePlaying: null });
  }

  async function playTone(n: StringNumber): Promise<void> {
    try {
      ctx = await ensureAudioContext();
    } catch (e) {
      console.warn("[ukulele-tune] audio output unavailable", e);
      return;
    }
    if (!tone || toneCtx !== ctx) {
      tone?.stop();
      tone = createTonePlayer(ctx);
      toneCtx = ctx;
    }
    const { settings } = store.get();
    const str = getTuning(settings.tuningId).strings.find((x) => x.number === n);
    if (!str) return;
    tone.play(midiToFreq(str.midi, settings.a4));
    tuner.reset();
    store.set({ tonePlaying: n, reading: EMPTY_READING });
    startLoop();
  }

  function setMode(mode: TunerMode): void {
    tuner.update({ mode });
    store.set({ mode, reading: EMPTY_READING });
  }

  function applySettings(next: Settings, prev: Settings): void {
    saveSettings(storage, next);
    let mode = store.get().mode;
    if (next.tuningId !== prev.tuningId) {
      mode = { kind: "auto" };
      stopTone();
    }
    tuner.update(tunerConfig(next, mode));
    if (next.bufferSize !== prev.bufferSize) buildDetector();
    applyTheme(next.theme);
    store.set({ mode, reading: EMPTY_READING });
  }

  function updateSettings(patch: Partial<Settings>): void {
    const prev = store.get().settings;
    const next = sanitizeSettings({ ...prev, ...patch });
    if (JSON.stringify(next) === JSON.stringify(prev)) return;
    store.set({ settings: next });
    applySettings(next, prev);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopTone();
      if (store.get().micState === "running") {
        resumeOnVisible = true;
        stopMicSession();
        store.set({ micState: "idle", reading: EMPTY_READING });
      }
      cancelAnimationFrame(raf);
      raf = 0;
    } else {
      startLoop();
      if (resumeOnVisible) {
        resumeOnVisible = false;
        // Permission is already granted, so this normally succeeds without a prompt.
        // If the browser refuses without a gesture, the error screen offers "Try again".
        void beginMic(attempt);
      }
    }
  });

  applyTheme(store.get().settings.theme);

  return {
    startMic: () => void beginMic(),
    startTonesOnly: () => {
      stopMicSession();
      void ensureAudioContext().catch(() => undefined);
      store.set({ micState: "off", screen: "tuner", reading: EMPTY_READING });
      startLoop();
    },
    navigate: (screen: Screen) => {
      const cur = store.get().screen;
      const returnTo = cur === "settings" || cur === "help" ? store.get().returnTo : cur;
      store.set({ screen, returnTo });
    },
    back: () => store.set({ screen: store.get().returnTo }),
    setMode,
    toggleString: (n) => {
      const m = store.get().mode;
      setMode(
        m.kind === "manual" && m.stringNumber === n
          ? { kind: "auto" }
          : { kind: "manual", stringNumber: n },
      );
    },
    toggleTone: (n) => {
      if (store.get().tonePlaying === n) stopTone();
      else void playTone(n);
    },
    updateSettings,
    resetSettings: () => updateSettings({ ...DEFAULT_SETTINGS }),
  };
}

function applyTheme(theme: Settings["theme"]): void {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  const dark =
    theme === "dark" ||
    (theme === "system" && !window.matchMedia?.("(prefers-color-scheme: light)").matches);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#141A24" : "#F7F8FA");
}
