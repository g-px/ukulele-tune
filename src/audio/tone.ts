export interface TonePlayer {
  play(freq: number): void;
  stop(): void;
  readonly playing: boolean;
}

const ATTACK_S = 0.01;
const RELEASE_S = 0.03;

/** Reference tone: triangle oscillator with a short envelope to avoid clicks. */
export function createTonePlayer(
  ctx: AudioContext,
  opts: { type?: OscillatorType; gain?: number } = {},
): TonePlayer {
  const type = opts.type ?? "triangle";
  const level = opts.gain ?? 0.3;
  let current: { osc: OscillatorNode; gain: GainNode } | null = null;

  function stop(): void {
    if (!current) return;
    const { osc, gain } = current;
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + RELEASE_S);
    osc.stop(t + RELEASE_S + 0.01);
    osc.onended = () => gain.disconnect();
    current = null;
  }

  function play(freq: number): void {
    stop();
    const t = ctx.currentTime;
    const osc = new OscillatorNode(ctx, { type, frequency: freq });
    const gain = new GainNode(ctx, { gain: 0 });
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level, t + ATTACK_S);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    current = { osc, gain };
  }

  return {
    play,
    stop,
    get playing() {
      return current !== null;
    },
  };
}
