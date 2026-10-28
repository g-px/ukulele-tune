/**
 * One shared AudioContext. It must be created or resumed inside a user
 * gesture or while the mic is capturing (iOS Safari).
 */
type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;

export function audioContextSupported(): boolean {
  return getCtor() !== undefined;
}

function getCtor(): AudioContextCtor | undefined {
  const w = globalThis as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext;
}

function create(Ctor: AudioContextCtor, sampleRate: number | undefined): AudioContext {
  if (sampleRate) {
    try {
      return new Ctor({ latencyHint: "interactive", sampleRate });
    } catch {
      // Rate outside what this browser accepts; fall back to its default.
    }
  }
  return new Ctor({ latencyHint: "interactive" });
}

/**
 * Return a running context. With `sampleRate`, a context at another rate is
 * replaced: some WebKit versions feed silence when mic and context rates differ.
 */
export async function ensureAudioContext(sampleRate?: number): Promise<AudioContext> {
  const Ctor = getCtor();
  if (!Ctor) throw Object.assign(new Error("Web Audio unsupported"), { name: "UnsupportedError" });
  if (ctx && sampleRate && ctx.sampleRate !== sampleRate) closeAudioContext();
  if (!ctx || ctx.state === "closed") ctx = create(Ctor, sampleRate);
  if (ctx.state !== "running") {
    try {
      await ctx.resume();
    } catch {
      // iOS PWAs sometimes fail to resume; a fresh context is the known workaround.
      ctx = create(Ctor, sampleRate);
      await ctx.resume();
    }
  }
  return ctx;
}

/** Drop the shared context so the next ensureAudioContext builds a fresh one. */
export function closeAudioContext(): void {
  if (ctx && ctx.state !== "closed") void ctx.close().catch(() => undefined);
  ctx = null;
}

export function currentAudioContext(): AudioContext | null {
  return ctx;
}
