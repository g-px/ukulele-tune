/** The active locale's strings. `S` is a live binding: setLocale swaps it before the UI mounts. */
import { getTuning } from "./core/tunings";
import { en } from "./i18n/en";
import { ptBR } from "./i18n/pt-BR";
import type { Strings } from "./i18n/types";
import type { Locale } from "./state/locale";

export type { Strings };

export let S: Strings = en;

export function setLocale(locale: Locale): void {
  S = locale === "pt-BR" ? ptBR : en;
}

/** Localized tuning name, falling back to the English name in tunings.ts. */
export function tuningName(id: string): string {
  return S.tuningNames[id] ?? getTuning(id).name;
}
