import { afterEach, describe, expect, it } from "vitest";
import { TUNINGS } from "../../src/core/tunings";
import { en } from "../../src/i18n/en";
import { ptBR } from "../../src/i18n/pt-BR";
import { S, setLocale, tuningName } from "../../src/strings";

/** Every leaf path with its kind, so locales can be compared shape for shape. */
function shape(value: unknown, path = ""): Map<string, string> {
  const out = new Map<string, string>();
  if (typeof value === "function") out.set(path, `fn/${value.length}`);
  else if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    for (const [k, v] of Object.entries(value)) {
      for (const [p, kind] of shape(v, `${path}.${k}`)) out.set(p, kind);
    }
  } else out.set(path, typeof value);
  return out;
}

function leaves(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "object" && value !== null) return Object.values(value).flatMap(leaves);
  return [];
}

afterEach(() => setLocale("en"));

describe("locales", () => {
  it("pt-BR has exactly the English keys, with the same kinds and arities", () => {
    expect([...shape(ptBR).entries()].sort()).toEqual([...shape(en).entries()].sort());
  });

  it("no pt-BR string is empty", () => {
    for (const text of leaves(ptBR)) expect(text.trim()).not.toBe("");
  });

  it("every tuning has a name in both locales", () => {
    for (const t of TUNINGS) {
      expect(en.tuningNames[t.id]).toBeTruthy();
      expect(ptBR.tuningNames[t.id]).toBeTruthy();
    }
  });

  it("setLocale swaps the live binding", () => {
    expect(S.help).toBe("Help");
    setLocale("pt-BR");
    expect(S.help).toBe("Ajuda");
    expect(tuningName("c-low-g")).toBe("Padrão em Dó (Sol grave)");
    expect(S.announce("E4", -23, "tighten")).toBe("E4, 23 cents abaixo, apertar");
    setLocale("en");
    expect(tuningName("c-low-g")).toBe("Standard C (low G)");
  });
});
