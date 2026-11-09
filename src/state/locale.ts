export type Locale = "en" | "pt-BR";
export type LanguagePref = "auto" | Locale;

export const LANGUAGE_PREFS: readonly LanguagePref[] = ["auto", "en", "pt-BR"];

/** An explicit choice wins; otherwise the first English or Portuguese browser language decides. */
export function resolveLocale(pref: LanguagePref, languages: readonly string[]): Locale {
  if (pref !== "auto") return pref;
  for (const lang of languages) {
    const l = lang.toLowerCase();
    if (l.startsWith("pt")) return "pt-BR";
    if (l.startsWith("en")) return "en";
  }
  return "en";
}
