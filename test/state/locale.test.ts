import { describe, expect, it } from "vitest";
import { resolveLocale } from "../../src/state/locale";

describe("resolveLocale", () => {
  it("follows the first English or Portuguese browser language", () => {
    expect(resolveLocale("auto", ["pt-BR"])).toBe("pt-BR");
    expect(resolveLocale("auto", ["pt"])).toBe("pt-BR");
    expect(resolveLocale("auto", ["PT-pt"])).toBe("pt-BR");
    expect(resolveLocale("auto", ["en-US", "pt-BR"])).toBe("en");
    expect(resolveLocale("auto", ["fr-FR", "pt-BR"])).toBe("pt-BR");
    expect(resolveLocale("auto", ["de-DE"])).toBe("en");
    expect(resolveLocale("auto", [])).toBe("en");
  });

  it("an explicit choice wins", () => {
    expect(resolveLocale("en", ["pt-BR"])).toBe("en");
    expect(resolveLocale("pt-BR", ["en-US"])).toBe("pt-BR");
  });
});
