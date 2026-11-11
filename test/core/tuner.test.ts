import { describe, expect, it } from "vitest";
import { createTuner, levelFromDbfs, type TunerConfig } from "../../src/core/tuner";
import { getTuning } from "../../src/core/tunings";
import { rng } from "../helpers/signal";

function config(patch: Partial<TunerConfig> = {}): TunerConfig {
  return {
    a4: 440,
    tuning: getTuning("c-high-g"),
    mode: { kind: "auto" },
    flats: false,
    inTuneCents: 5,
    clarityThreshold: 0.9,
    gateDbfs: -45,
    medianSize: 5,
    filter: {
      driftCents: 3,
      noiseFloorCents: 0.5,
      noisePerClarity: 200,
      trendMs: 150,
      trendDeadband: 0.35,
      chase: 8,
    },
    inTuneEnterMs: 100,
    inTuneExitMs: 150,
    inTuneExitFactor: 1.4,
    centsStickiness: 0.3,
    holdMs: 1000,
    attackSkipMs: 0,
    attackJumpDb: 10,
    ...patch,
  };
}

const FRAME_MS = 16;
function frames(tuner: ReturnType<typeof createTuner>, freqs: number[], start = 0, dbfs = -20) {
  return freqs.map((f, i) =>
    tuner.process({ frequency: f, clarity: 0.98, rmsDbfs: dbfs, timeMs: start + i * FRAME_MS }),
  );
}

describe("tuner: auto mode", () => {
  it("locks in tune on the G string after a steady 100 ms", () => {
    const t = createTuner(config());
    const out = frames(t, Array(20).fill(392));
    // Frames are 16 ms apart: 96 ms at frame 6, 112 ms at frame 7.
    for (let i = 0; i <= 6; i++) expect(out[i]?.inTune).toBe(false);
    for (let i = 7; i < 20; i++) expect(out[i]?.inTune).toBe(true);
    expect(out[0]?.direction).toBe("in-tune");
    const lastOut = out[19];
    expect(lastOut?.direction).toBe("in-tune");
    expect(lastOut?.stringNumber).toBe(4);
    expect(lastOut?.noteLabel).toBe("G4");
    expect(lastOut?.status).toBe("note");
    expect(lastOut?.stale).toBe(false);
  });

  it("ignores a single outlier frame", () => {
    const t = createTuner(config());
    const out = frames(t, [392, 392, 392, 392, 784, 392, 392]);
    for (const r of out) {
      expect(r.noteLabel).toBe("G4");
      expect(Math.abs(r.cents)).toBeLessThan(1);
    }
  });

  it("reports flat and sharp", () => {
    const t = createTuner(config());
    const flat = frames(t, Array(5).fill(380)).at(-1);
    expect(flat?.direction).toBe("flat");
    expect(flat?.inTune).toBe(false);
    t.reset();
    const sharp = frames(t, Array(5).fill(450)).at(-1);
    expect(sharp?.direction).toBe("sharp");
    expect(sharp?.stringNumber).toBe(1);
  });

  it("follows a newly plucked string quickly", () => {
    const t = createTuner(config());
    const out = frames(t, [...Array(8).fill(392), ...Array(6).fill(261.63)]);
    const lastOut = out.at(-1);
    expect(lastOut?.noteLabel).toBe("C4");
    expect(Math.abs(lastOut?.cents ?? 99)).toBeLessThan(1);
  });

  it("carries the octave hint and partner tuning", () => {
    const t = createTuner(config());
    const r = frames(t, Array(5).fill(196)).at(-1);
    expect(r?.octaveHint).toBe("octave-low");
    expect(r?.partnerTuningId).toBe("c-low-g");
    expect(r?.cents).toBeCloseTo(-1200, 0);
  });
});

describe("tuner: gating and hold", () => {
  it("is silent below the gate and keeps a stale reading until holdMs", () => {
    const t = createTuner(config());
    frames(t, Array(5).fill(392));
    const lastGood = 4 * FRAME_MS;
    const quiet = (ms: number) =>
      t.process({ frequency: 392, clarity: 1, rmsDbfs: -70, timeMs: ms });
    const held = quiet(lastGood + 500);
    expect(held.status).toBe("silent");
    expect(held.stale).toBe(true);
    expect(held.noteLabel).toBe("G4");
    const gone = quiet(lastGood + 1001);
    expect(gone.status).toBe("silent");
    expect(gone.noteLabel).toBe("");
    expect(gone.stale).toBe(false);
    expect(gone.direction).toBe("none");
  });

  it("treats low clarity or no pitch as noisy", () => {
    const t = createTuner(config());
    expect(t.process({ frequency: 392, clarity: 0.5, rmsDbfs: -20, timeMs: 0 }).status).toBe(
      "noisy",
    );
    expect(t.process({ frequency: 0, clarity: 1, rmsDbfs: -20, timeMs: 16 }).status).toBe("noisy");
  });

  it("treats -Infinity dBFS as silent with level 0", () => {
    const t = createTuner(config());
    const r = t.process({ frequency: 0, clarity: 0, rmsDbfs: -Infinity, timeMs: 0 });
    expect(r.status).toBe("silent");
    expect(r.level).toBe(0);
  });

  it("skips the attack after a level jump", () => {
    const t = createTuner(config({ attackSkipMs: 60 }));
    t.process({ frequency: 0, clarity: 0, rmsDbfs: -70, timeMs: 0 });
    const attack = t.process({ frequency: 392, clarity: 1, rmsDbfs: -20, timeMs: 16 });
    expect(attack.status).toBe("noisy");
    const settled = t.process({ frequency: 392, clarity: 1, rmsDbfs: -21, timeMs: 80 });
    expect(settled.status).toBe("note");
  });

  it("flags the frame where the level jumps as an attack", () => {
    const t = createTuner(config());
    expect(t.process({ frequency: 0, clarity: 0, rmsDbfs: -70, timeMs: 0 }).attack).toBe(false);
    expect(t.process({ frequency: 392, clarity: 1, rmsDbfs: -20, timeMs: 16 }).attack).toBe(true);
    expect(t.process({ frequency: 392, clarity: 1, rmsDbfs: -22, timeMs: 33 }).attack).toBe(false);
    expect(t.process({ frequency: 392, clarity: 1, rmsDbfs: -21, timeMs: 50 }).attack).toBe(false);
  });

  it("maps level from dBFS", () => {
    expect(levelFromDbfs(0)).toBe(1);
    expect(levelFromDbfs(-30)).toBe(0.5);
    expect(levelFromDbfs(-90)).toBe(0);
    expect(levelFromDbfs(-Infinity)).toBe(0);
  });
});

/** Hz for a pitch `cents` away from the G string (392 Hz at A4 = 440). */
const G4 = 440 * 2 ** (-2 / 12);
const off = (cents: number) => G4 * 2 ** (cents / 1200);

describe("tuner: in-tune latch", () => {
  it("stays in tune while the note wobbles just past the window", () => {
    const t = createTuner(config());
    frames(t, Array(12).fill(off(3)));
    // ±5 window, exit at 7: a note hovering around 5.5 must not flicker.
    const wobble = Array.from({ length: 60 }, (_, i) => off(i % 2 ? 6.2 : 4.8));
    const out = frames(t, wobble, 12 * FRAME_MS);
    expect(out.every((r) => r.inTune)).toBe(true);
    expect(out.every((r) => r.direction === "in-tune")).toBe(true);
  });

  it("does not latch on a note that sits just outside the window", () => {
    const t = createTuner(config());
    const out = frames(t, Array(60).fill(off(6)));
    expect(out.some((r) => r.inTune)).toBe(false);
    expect(out.at(-1)?.direction).toBe("sharp");
  });

  it("leaves in tune only after 150 ms clearly outside", () => {
    const t = createTuner(config());
    frames(t, Array(12).fill(off(0)));
    // One clear frame is taken almost whole, so the reading is at 12 cents at once.
    const out = frames(t, Array(20).fill(off(12)), 12 * FRAME_MS);
    const firstOut = out.findIndex((r) => !r.inTune);
    const outsideFrom = out.findIndex((r) => Math.abs(r.cents) > 7);
    expect(outsideFrom).toBeGreaterThanOrEqual(0);
    expect((firstOut - outsideFrom) * FRAME_MS).toBeGreaterThanOrEqual(150);
    expect((firstOut - outsideFrom) * FRAME_MS).toBeLessThan(150 + 2 * FRAME_MS);
    expect(out.at(-1)?.direction).toBe("sharp");
  });

  it("keeps the latch through a short dropout and while the reading is held", () => {
    const t = createTuner(config());
    frames(t, Array(12).fill(392));
    const base = 12 * FRAME_MS;
    const noisy = t.process({ frequency: 0, clarity: 0, rmsDbfs: -20, timeMs: base });
    expect(noisy.stale).toBe(true);
    expect(noisy.inTune).toBe(true);
    const back = t.process({ frequency: 392, clarity: 0.98, rmsDbfs: -20, timeMs: base + 16 });
    expect(back.inTune).toBe(true);
    expect(back.stale).toBe(false);
    const faded = t.process({ frequency: 0, clarity: 0, rmsDbfs: -70, timeMs: base + 600 });
    expect(faded.stale).toBe(true);
    expect(faded.inTune).toBe(true);
  });

  it("starts again from scratch once the held reading has expired", () => {
    const t = createTuner(config());
    frames(t, Array(12).fill(392));
    t.process({ frequency: 0, clarity: 0, rmsDbfs: -70, timeMs: 5000 });
    const next = t.process({ frequency: 392, clarity: 0.98, rmsDbfs: -20, timeMs: 5016 });
    expect(next.inTune).toBe(false);
  });

  it("drops the latch at once when another string is plucked", () => {
    const t = createTuner(config());
    frames(t, Array(12).fill(392));
    const out = frames(t, Array(6).fill(350), 12 * FRAME_MS);
    expect(out.at(-1)?.inTune).toBe(false);
  });
});

describe("tuner: steady read-out", () => {
  it("keeps the whole-cent figure still while the pitch hovers around a half", () => {
    const t = createTuner(config());
    const hover = Array.from({ length: 90 }, (_, i) => off(2.5 + (i % 2 ? 0.2 : -0.2)));
    const shown = frames(t, hover).map((r) => r.shownCents);
    expect(new Set(shown.slice(10)).size).toBe(1);
  });

  it("barely moves on an unclear, fading note", () => {
    const t = createTuner(config());
    const noise = rng(3);
    const out: number[] = [];
    for (let i = 0; i < 120; i++) {
      const r = t.process({
        frequency: off((noise() - 0.5) * 16),
        clarity: 0.92,
        rmsDbfs: -40,
        timeMs: i * FRAME_MS,
      });
      if (i >= 30) out.push(r.cents);
    }
    expect(Math.max(...out) - Math.min(...out)).toBeLessThan(3);
  });

  it("re-acquires at once when the same string is plucked again at a new pitch", () => {
    const t = createTuner(config({ attackSkipMs: 60 }));
    let ms = 0;
    const step = (frequency: number, clarity: number, rmsDbfs: number) =>
      t.process({ frequency, clarity, rmsDbfs, timeMs: (ms += FRAME_MS) });
    for (let i = 0; i < 40; i++) step(off(-20), 0.93, -30 - i * 0.4);
    // Pluck again after a turn of the peg: the level jumps, the pitch is now 5 cents flat.
    step(off(-5), 0.99, -20);
    let r = step(off(-5), 0.99, -20);
    while (r.status !== "note") r = step(off(-5), 0.99, -20);
    expect(r.cents).toBeCloseTo(-5, 0);
  });
});

describe("tuner: manual and chromatic", () => {
  it("manual lock measures against the chosen string", () => {
    const t = createTuner(config({ mode: { kind: "manual", stringNumber: 2 } }));
    const r = frames(t, Array(5).fill(262)).at(-1);
    expect(r?.noteLabel).toBe("E4");
    expect(r?.stringNumber).toBe(2);
    expect(r?.cents).toBeCloseTo(-397.5, 0);
    expect(r?.direction).toBe("flat");
  });

  it("chromatic names the nearest note", () => {
    const t = createTuner(config({ mode: { kind: "chromatic" } }));
    const r = frames(t, Array(5).fill(262)).at(-1);
    expect(r?.noteLabel).toBe("C4");
    expect(r?.stringNumber).toBeNull();
    expect(r?.cents).toBeCloseTo(2.4, 0);
  });

  it("chromatic honours flats", () => {
    const t = createTuner(config({ mode: { kind: "chromatic" }, flats: true }));
    expect(frames(t, Array(3).fill(277.18)).at(-1)?.noteLabel).toBe("Db4");
  });

  it("update() changes config and resets state", () => {
    const t = createTuner(config());
    frames(t, Array(5).fill(392));
    t.update({ a4: 442 });
    expect(t.config.a4).toBe(442);
    const r = frames(t, Array(8).fill(393.78)).at(-1);
    expect(r?.cents).toBeCloseTo(0, 0);
    expect(r?.inTune).toBe(true);
  });
});
