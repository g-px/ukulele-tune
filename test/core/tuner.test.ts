import { describe, expect, it } from "vitest";
import { createTuner, levelFromDbfs, type TunerConfig } from "../../src/core/tuner";
import { getTuning } from "../../src/core/tunings";

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
    emaAlpha: 0.3,
    inTuneHoldFrames: 3,
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
  it("locks in tune on the G string after the hold frames", () => {
    const t = createTuner(config());
    const out = frames(t, Array(20).fill(392));
    expect(out[0]?.inTune).toBe(false);
    expect(out[1]?.inTune).toBe(false);
    expect(out[2]?.inTune).toBe(true);
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
    expect(held.inTune).toBe(false);
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

  it("maps level from dBFS", () => {
    expect(levelFromDbfs(0)).toBe(1);
    expect(levelFromDbfs(-30)).toBe(0.5);
    expect(levelFromDbfs(-90)).toBe(0);
    expect(levelFromDbfs(-Infinity)).toBe(0);
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
    const r = frames(t, Array(3).fill(393.78)).at(-1);
    expect(r?.cents).toBeCloseTo(0, 0);
    expect(r?.inTune).toBe(true);
  });
});
