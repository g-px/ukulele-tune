/**
 * One shared AudioContext. It must be created or resumed inside a user
 * gesture (iOS Safari), so callers only use this from click handlers.
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

export async function ensureAudioContext(): Promise<AudioContext> {
  const Ctor = getCtor();
  if (!Ctor) throw Object.assign(new Error("Web Audio unsupported"), { name: "UnsupportedError" });
  if (!ctx || ctx.state === "closed") ctx = new Ctor({ latencyHint: "interactive" });
  if (ctx.state !== "running") {
    try {
      await ctx.resume();
    } catch {
      // iOS PWAs sometimes fail to resume; a fresh context is the known workaround.
      ctx = new Ctor({ latencyHint: "interactive" });
      await ctx.resume();
    }
  }
  return ctx;
}

export function currentAudioContext(): AudioContext | null {
  return ctx;
}
