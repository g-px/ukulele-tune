export interface MicOptions {
  bufferSize: number;
  highpassHz: number;
  lowpassHz: number;
}

export interface MicSession {
  readonly sampleRate: number;
  /** What the browser actually applied (logged for debugging). */
  readonly settings: MediaTrackSettings;
  /** Copy the latest `bufferSize` time-domain samples into target. */
  read(target: Float32Array<ArrayBuffer>): void;
  setBufferSize(size: number): void;
  /** One-line state summary for the ?debug readout. */
  describe(): string;
  stop(): void;
}

/** How hard to ask for an unprocessed signal. Later entries are fallbacks. */
export type CaptureProfile = "raw" | "plain";

interface AudioSessionLike {
  type: string;
}

/**
 * iOS 16.4+: make the page's audio session record as well as play, so mic
 * input reaches Web Audio even when the page has played sound before.
 */
function preferPlayAndRecord(): void {
  const session = (navigator as Navigator & { audioSession?: AudioSessionLike }).audioSession;
  if (session && session.type !== "play-and-record") {
    try {
      session.type = "play-and-record";
    } catch {
      // Older WebKit exposes the object but rejects the value; nothing else to do.
    }
  }
}

/**
 * Request the mic. Called before the AudioContext exists: iOS Safari can
 * deliver silence to a context created before capture started, and an
 * active capture lets the context start without a fresh user gesture.
 */
export async function requestMicStream(profile: CaptureProfile): Promise<MediaStream> {
  const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
  if (!md?.getUserMedia) {
    throw Object.assign(new Error("getUserMedia unsupported"), { name: "UnsupportedError" });
  }
  preferPlayAndRecord();
  const audio: MediaTrackConstraints | true =
    profile === "raw"
      ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      : true;
  return md.getUserMedia({ audio, video: false });
}

/** Sample rate the mic track reports, if any; used to build a matching context. */
export function streamSampleRate(stream: MediaStream): number | undefined {
  return stream.getAudioTracks()[0]?.getSettings().sampleRate;
}

/** Build the analysis graph for an already granted stream. */
export function createMicSession(
  ctx: AudioContext,
  stream: MediaStream,
  opts: MicOptions,
): MicSession {
  const track = stream.getAudioTracks()[0];
  const settings = track?.getSettings() ?? {};
  console.info("[ukulele-tune] mic settings", settings, "sampleRate", ctx.sampleRate);

  const source = ctx.createMediaStreamSource(stream);
  const highpass = new BiquadFilterNode(ctx, {
    type: "highpass",
    frequency: opts.highpassHz,
    Q: 0.707,
  });
  const lowpass = new BiquadFilterNode(ctx, {
    type: "lowpass",
    frequency: opts.lowpassHz,
    Q: 0.707,
  });
  const analyser = new AnalyserNode(ctx, { fftSize: opts.bufferSize, smoothingTimeConstant: 0 });
  // WebKit only pulls audio through nodes that reach the destination; an
  // unconnected analyser reads silence there. The zero gain keeps it inaudible.
  const sink = new GainNode(ctx, { gain: 0 });
  source
    .connect(highpass)
    .connect(lowpass)
    .connect(analyser)
    .connect(sink)
    .connect(ctx.destination);

  let stopped = false;
  return {
    sampleRate: ctx.sampleRate,
    settings,
    read(target) {
      analyser.getFloatTimeDomainData(target);
    },
    setBufferSize(size) {
      analyser.fftSize = size;
    },
    describe() {
      const t = track
        ? `track ${track.readyState}${track.muted ? " muted" : ""}${track.enabled ? "" : " disabled"}`
        : "no track";
      return `ctx ${ctx.state} ${ctx.sampleRate} Hz · ${t} · mic ${settings.sampleRate ?? "?"} Hz`;
    },
    stop() {
      if (stopped) return;
      stopped = true;
      for (const t of stream.getTracks()) t.stop();
      source.disconnect();
      highpass.disconnect();
      lowpass.disconnect();
      analyser.disconnect();
      sink.disconnect();
    },
  };
}
