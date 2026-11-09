/**
 * Connects audio to state: owns the AudioContext, mic session, detector,
 * tuner and tone player, runs the per-frame loop and implements Actions.
 */
import { audioContextSupported, closeAudioContext, ensureAudioContext } from "./audio/context";
import { classifyMicError, micEnvironmentError, type MicError } from "./audio/mic-errors";
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
  GUIDE_HOLD_MS,
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
import {
  EMPTY_READING,
  createTuner,
  type TunerConfig,
  type TunerMode,
  type TunerReading,
} from "./core/tuner";
import { getTuning, type StringNumber } from "./core/tunings";
import {
  currentString,
  skipGuideString,
  startGuide,
  stepGuide,
  type GuideState,
} from "./core/guide";
import type { Actions, AppState, Screen } from "./state/app-state";
import { createListenSequencer } from "./state/listen";
import {
  EMPTY_LISTEN,
  canGoNext,
  nextStep,
  prevStep,
  result,
  startSetup,
  type SetupState,
} from "./state/setup";
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
  /** Where a started mic lands: the tuner, or stay put (the setup listen step). */
  let micTarget: "tuner" | "stay" = "tuner";
  let setupReturn: Screen = "start";
  const listenSeq = createListenSequencer();
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
    if (st.setup?.step === "listen") feedListen(st.setup, reading, now);
    if (st.guide && !st.guide.done) {
      const next = stepGuide(
        st.guide,
        { stringNumber: reading.stringNumber, inTune: reading.inTune, timeMs: now },
        GUIDE_HOLD_MS,
      );
      if (next !== st.guide) {
        setGuide(next);
        if (currentString(next) !== currentString(st.guide)) return;
      }
    }
    store.set({
      reading,
      nowMs: now,
      lastNoteMs: reading.status === "note" ? now : st.lastNoteMs,
      ...(DEBUG && frameCount % 15 === 0 ? { debugInfo: debugLine(level) } : {}),
    });
  }

  function feedListen(setup: SetupState, reading: TunerReading, now: number): void {
    const listen = listenSeq.push(setup.listen, {
      status: reading.status,
      frequency: reading.frequency,
      timeMs: now,
    });
    if (listen) store.set({ setup: { ...setup, listen } });
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
      micFailed(envError);
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
        ...(micTarget === "tuner" ? { screen: "tuner" as const } : {}),
        lastNoteMs: now,
        nowMs: now,
        reading: EMPTY_READING,
      });
      startLoop();
    } catch (e) {
      console.warn("[ukulele-tune] microphone failed", e);
      if (!mic) for (const t of stream?.getTracks() ?? []) t.stop();
      stopMicSession();
      micFailed(classifyMicError(e));
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

  function startTones(): void {
    stopMicSession();
    void ensureAudioContext().catch(() => undefined);
    store.set({ micState: "off", screen: "tuner", reading: EMPTY_READING });
    startLoop();
  }

  function micFailed(micError: MicError): void {
    if (micTarget === "stay") {
      const setup = store.get().setup;
      store.set({
        micState: "error",
        micError,
        setup: setup ? { ...setup, listen: { ...EMPTY_LISTEN, skipped: true } } : null,
      });
    } else {
      store.set({ micState: "error", micError, screen: "mic-error" });
    }
  }

  function startMicFor(target: "tuner" | "stay"): void {
    micTarget = target;
    void beginMic();
  }

  function setSetup(setup: SetupState): void {
    const prev = store.get().setup;
    const entering = setup.step === "listen" && prev?.step !== "listen";
    const leaving = setup.step !== "listen" && prev?.step === "listen";
    if (entering) {
      listenSeq.reset();
      setMode({ kind: "chromatic" });
    }
    if (leaving) setMode({ kind: "auto" });
    store.set({ setup });
  }

  function closeSetup(screen: Screen): void {
    if (store.get().setup?.step === "listen") setMode({ kind: "auto" });
    if (store.get().micState === "running") {
      stopMicSession();
      store.set({ micState: "idle" });
    }
    store.set({ setup: null, screen });
  }

  /** Store the guide and lock the tuner on its string when the string changes. */
  function setGuide(guide: GuideState): void {
    const prev = store.get().guide;
    const n = currentString(guide);
    store.set({ guide, wrongWay: false });
    if (prev && currentString(prev) === n) return;
    if (prev) navigator.vibrate?.(30);
    setMode(n === null ? { kind: "auto" } : { kind: "manual", stringNumber: n });
  }

  function startGuided(): void {
    store.set({ guide: null, screen: "tuner" });
    setGuide(startGuide());
    if (store.get().micState !== "running") startMicFor("tuner");
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
    if (next.language !== prev.language) {
      // Every screen is built with the old locale's strings; a reload rebuilds them.
      location.reload();
      return;
    }
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
    startMic: () => startMicFor("tuner"),
    startTonesOnly: startTones,
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
    resetSettings: () => {
      const { language, onboarded, ukuleleSize } = store.get().settings;
      updateSettings({ ...DEFAULT_SETTINGS, language, onboarded, ukuleleSize });
    },
    openSetup: () => {
      const cur = store.get().screen;
      setupReturn = cur === "setup" ? setupReturn : cur;
      stopTone();
      store.set({ setup: startSetup(), guide: null, screen: "setup" });
    },
    setupAnswer: (patch) => {
      const setup = store.get().setup;
      if (setup) store.set({ setup: { ...setup, ...patch } });
    },
    setupNext: () => {
      const setup = store.get().setup;
      if (setup && canGoNext(setup)) setSetup(nextStep(setup));
    },
    setupBack: () => {
      const setup = store.get().setup;
      if (!setup) return;
      if (setup.step === "hold") closeSetup(setupReturn);
      else setSetup(prevStep(setup));
    },
    setupSkip: () => {
      updateSettings({ onboarded: true });
      closeSetup(setupReturn === "setup" ? "start" : setupReturn);
    },
    setupListenStart: () => {
      listenSeq.reset();
      const setup = store.get().setup;
      if (setup) store.set({ setup: { ...setup, listen: EMPTY_LISTEN } });
      startMicFor("stay");
    },
    setupListenRestart: () => {
      listenSeq.reset();
      const setup = store.get().setup;
      if (setup) store.set({ setup: { ...setup, listen: EMPTY_LISTEN } });
    },
    setupListenSkip: () => {
      const setup = store.get().setup;
      if (!setup) return;
      setSetup({ ...setup, step: "result", listen: { ...EMPTY_LISTEN, skipped: true } });
    },
    setupFinish: (next) => {
      const setup = store.get().setup;
      if (!setup) return;
      const found = result(setup);
      updateSettings({
        tuningId: found.tuningId,
        ukuleleSize: setup.size ?? "unknown",
        onboarded: true,
      });
      store.set({ setup: null });
      if (next === "guide") {
        startGuided();
      } else {
        closeSetup("settings");
        store.set({ returnTo: "start" });
      }
    },
    skipOnboarding: (next) => {
      updateSettings({ onboarded: true });
      if (next === "mic") startMicFor("tuner");
      else startTones();
    },
    guideSkipString: () => {
      const guide = store.get().guide;
      if (guide) setGuide(skipGuideString(guide));
    },
    guideAgain: () => startGuided(),
    guideExit: () => {
      store.set({ guide: null, wrongWay: false });
      setMode({ kind: "auto" });
    },
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
