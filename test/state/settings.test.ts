import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  loadSettings,
  sanitizeSettings,
  saveSettings,
  type KeyValueStorage,
} from "../../src/state/settings";
import { createStore } from "../../src/state/store";

function fakeStorage(initial: Record<string, string> = {}): KeyValueStorage & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

describe("settings", () => {
  it("defaults when nothing is stored", () => {
    expect(loadSettings(fakeStorage())).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("round-trips through storage", () => {
    const s = fakeStorage();
    const custom = { ...DEFAULT_SETTINGS, a4: 442, tuningId: "baritone", leftHanded: true };
    saveSettings(s, custom);
    expect(JSON.parse(s.data[STORAGE_KEY] ?? "{}").a4).toBe(442);
    expect(loadSettings(s)).toEqual(custom);
  });

  it("repairs bad values field by field", () => {
    const fixed = sanitizeSettings({
      tuningId: "banjo",
      a4: 1000,
      inTuneCents: 7,
      flats: "yes",
      leftHanded: true,
      theme: "neon",
      bufferSize: 1024,
      gateDbfs: -5,
    });
    expect(fixed).toEqual({
      ...DEFAULT_SETTINGS,
      a4: 466,
      leftHanded: true,
      gateDbfs: -20,
    });
    expect(sanitizeSettings({ a4: 400.4, inTuneCents: 3, bufferSize: 4096 })).toMatchObject({
      a4: 415,
      inTuneCents: 3,
      bufferSize: 4096,
    });
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("survives corrupt JSON and throwing storage", () => {
    expect(loadSettings(fakeStorage({ [STORAGE_KEY]: "{not json" }))).toEqual(DEFAULT_SETTINGS);
    const throwing: KeyValueStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(loadSettings(throwing)).toEqual(DEFAULT_SETTINGS);
    expect(() => saveSettings(throwing, DEFAULT_SETTINGS)).not.toThrow();
  });
});

describe("store", () => {
  it("merges patches and notifies with previous state", () => {
    const store = createStore({ a: 1, b: "x" });
    const seen: Array<[number, number]> = [];
    const off = store.subscribe((s, p) => seen.push([s.a, p.a]));
    store.set({ a: 2 });
    expect(store.get()).toEqual({ a: 2, b: "x" });
    off();
    store.set({ a: 3 });
    expect(seen).toEqual([[2, 1]]);
  });
});
