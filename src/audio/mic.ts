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
  stop(): void;
}

/** Request the mic with all voice processing off and build the analysis graph. */
export async function startMic(ctx: AudioContext, opts: MicOptions): Promise<MicSession> {
  const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
  if (!md?.getUserMedia) {
    throw Object.assign(new Error("getUserMedia unsupported"), { name: "UnsupportedError" });
  }
  const stream = await md.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: { ideal: 1 },
    },
    video: false,
  });
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
  source.connect(highpass).connect(lowpass).connect(analyser);

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
    stop() {
      if (stopped) return;
      stopped = true;
      for (const t of stream.getTracks()) t.stop();
      source.disconnect();
      highpass.disconnect();
      lowpass.disconnect();
    },
  };
}
