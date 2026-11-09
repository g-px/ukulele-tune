import { describe, expect, it } from "vitest";
import {
  EMPTY_LISTEN,
  canGoNext,
  listenSameNote,
  nextStep,
  prevStep,
  result,
  startSetup,
  stepNumber,
  type SetupState,
} from "../../src/state/setup";

const walk = (s: SetupState, n: number) => {
  for (let i = 0; i < n; i++) s = nextStep(s);
  return s;
};

describe("setup wizard", () => {
  it("goes hold → size → look → listen → result", () => {
    const s = startSetup();
    expect([0, 1, 2, 3, 4, 5].map((n) => walk(s, n).step)).toEqual([
      "hold",
      "size",
      "look",
      "listen",
      "result",
      "result",
    ]);
  });

  it("baritone skips the look step both ways", () => {
    const s = { ...walk(startSetup(), 1), size: "baritone" as const };
    expect(nextStep(s).step).toBe("listen");
    expect(prevStep(nextStep(s)).step).toBe("size");
    expect(prevStep(startSetup()).step).toBe("hold");
  });

  it("numbers the steps 1 to 4", () => {
    expect((["hold", "size", "look", "listen", "result"] as const).map(stepNumber)).toEqual([
      1, 2, 3, 4, 4,
    ]);
  });

  it("needs an answer before moving on", () => {
    const size = walk(startSetup(), 1);
    expect(canGoNext(startSetup())).toBe(true);
    expect(canGoNext(size)).toBe(false);
    expect(canGoNext({ ...size, size: "unknown" })).toBe(true);
    const look = { ...size, step: "look" as const };
    expect(canGoNext(look)).toBe(false);
    expect(canGoNext({ ...look, look: "thin" })).toBe(true);
  });

  it("the listen step needs two different strings, or a skip", () => {
    const listen = { ...startSetup(), step: "listen" as const };
    expect(canGoNext(listen)).toBe(false);
    const one = { ...listen, listen: { ...EMPTY_LISTEN, string4Hz: 392 } };
    expect(canGoNext(one)).toBe(false);
    const same = { ...listen, listen: { ...EMPTY_LISTEN, string4Hz: 392, string3Hz: 390 } };
    expect(listenSameNote(same.listen)).toBe(true);
    expect(canGoNext(same)).toBe(false);
    const both = { ...listen, listen: { ...EMPTY_LISTEN, string4Hz: 392, string3Hz: 262 } };
    expect(canGoNext(both)).toBe(true);
    expect(canGoNext({ ...listen, listen: { ...EMPTY_LISTEN, skipped: true } })).toBe(true);
  });

  it("result uses the answers and the listen check", () => {
    const base: SetupState = { ...startSetup(), size: "tenor", look: "thick" };
    expect(result(base).tuningId).toBe("c-low-g");
    const heard = { ...base, listen: { ...EMPTY_LISTEN, string4Hz: 392, string3Hz: 262 } };
    expect(result(heard)).toEqual({
      tuningId: "c-high-g",
      basis: "listen",
      conflict: "look-vs-listen",
    });
    expect(result({ ...heard, listen: { ...heard.listen, skipped: true } }).basis).toBe("look");
    expect(result(startSetup())).toEqual({
      tuningId: "c-high-g",
      basis: "default",
      conflict: "none",
    });
  });
});
