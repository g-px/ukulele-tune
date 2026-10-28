import { describe, expect, it } from "vitest";
import { classifyMicError, micEnvironmentError } from "../../src/audio/mic-errors";

const err = (name: string) => Object.assign(new Error(name), { name });

describe("classifyMicError", () => {
  it.each([
    ["NotAllowedError", "denied"],
    ["SecurityError", "denied"],
    ["NotFoundError", "not-found"],
    ["OverconstrainedError", "not-found"],
    ["NotReadableError", "in-use"],
    ["AbortError", "in-use"],
    ["InsecureContextError", "insecure-context"],
    ["TypeError", "unsupported"],
    ["SomethingElse", "unknown"],
  ])("%s -> %s", (name, expected) => {
    expect(classifyMicError(err(name))).toBe(expected);
  });
  it("handles non-errors", () => {
    expect(classifyMicError("boom")).toBe("unknown");
    expect(classifyMicError(null)).toBe("unknown");
  });
});

describe("micEnvironmentError", () => {
  it("checks secure context first, then API support", () => {
    const ok = { isSecureContext: true, hasGetUserMedia: true, hasAudioContext: true };
    expect(micEnvironmentError(ok)).toBeNull();
    expect(micEnvironmentError({ ...ok, isSecureContext: false })).toBe("insecure-context");
    expect(micEnvironmentError({ ...ok, hasGetUserMedia: false })).toBe("unsupported");
    expect(micEnvironmentError({ ...ok, hasAudioContext: false })).toBe("unsupported");
  });
});
