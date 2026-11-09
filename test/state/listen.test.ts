import { describe, expect, it } from "vitest";
import { createListenSequencer, type ListenFrame } from "../../src/state/listen";
import { EMPTY_LISTEN, type ListenState } from "../../src/state/setup";

const FRAME_MS = 16.7;

type Segment = [ListenFrame["status"], number, number]; // status, Hz, duration ms

/** Run segments through a sequencer and return the final listen state. */
function run(segments: Segment[]): ListenState {
  const seq = createListenSequencer();
  let listen = EMPTY_LISTEN;
  let t = 0;
  for (const [status, hz, ms] of segments) {
    for (const end = t + ms; t < end; t += FRAME_MS) {
      listen = seq.push(listen, { status, frequency: hz, timeMs: t }) ?? listen;
    }
  }
  return listen;
}

describe("listen sequencer", () => {
  it("captures string 4, waits for a gap, then captures string 3", () => {
    const l = run([
      ["note", 392, 600],
      ["silent", 0, 300],
      ["note", 262, 600],
    ]);
    expect(l.string4Hz).toBeCloseTo(392, 6);
    expect(l.string3Hz).toBeCloseTo(262, 6);
  });

  it("does not capture a still-ringing string 4 twice", () => {
    const l = run([["note", 392, 2000]]);
    expect(l.string4Hz).toBeCloseTo(392, 6);
    expect(l.string3Hz).toBeNull();
  });

  it("a short dropout is not a gap", () => {
    const l = run([
      ["note", 392, 600],
      ["silent", 0, 100],
      ["note", 392, 1000],
    ]);
    expect(l.string3Hz).toBeNull();
  });

  it("a clearly different note opens the gate without silence", () => {
    const l = run([
      ["note", 196, 600],
      ["note", 262, 600],
    ]);
    expect(l.string4Hz).toBeCloseTo(196, 6);
    expect(l.string3Hz).toBeCloseTo(262, 6);
  });

  it("reset starts over", () => {
    const seq = createListenSequencer();
    let listen = EMPTY_LISTEN;
    for (let t = 0; t < 400; t += FRAME_MS) {
      listen = seq.push(listen, { status: "note", frequency: 392, timeMs: t }) ?? listen;
    }
    expect(listen.string4Hz).not.toBeNull();
    seq.reset();
    expect(seq.push(EMPTY_LISTEN, { status: "note", frequency: 262, timeMs: 500 })).toBeNull();
  });
});
