import type { Actions, AppState } from "../state/app-state";
import type { Store } from "../state/store";
import { S } from "../strings";
import { h, setAttr, setHidden } from "./dom";
import { icons } from "./icons";

/** Artboard 1 (returning user) and artboard 8 (first launch). */
export function startScreen(store: Store<AppState>, actions: Actions): HTMLElement {
  const startBtn = h(
    "button",
    { type: "button", class: "btn-primary", onclick: () => actions.startMic() },
    icons.mic(22),
    S.start.startTuner,
  );
  const returning = h(
    "div",
    { class: "start-actions" },
    h("p", {}, S.start.instruction),
    startBtn,
    h(
      "button",
      { type: "button", class: "btn-secondary", onclick: () => actions.startTonesOnly() },
      S.start.tonesOnly,
    ),
    h(
      "button",
      { type: "button", class: "link-btn", onclick: () => actions.openSetup() },
      S.start.setupLink,
    ),
  );

  const knowBtn = h(
    "button",
    { type: "button", class: "btn-secondary", onclick: () => actions.skipOnboarding("mic") },
    icons.mic(20),
    S.start.knowTuning,
  );
  const languages = (["en", "pt-BR"] as const).map((lang) =>
    h(
      "button",
      {
        type: "button",
        lang,
        "aria-pressed": String(document.documentElement.lang === lang),
        onclick: () => actions.updateSettings({ language: lang }),
      },
      lang === "en" ? "English" : "Português",
    ),
  );
  const first = h(
    "div",
    { class: "start-actions" },
    h("p", {}, S.start.firstLead),
    h(
      "button",
      { type: "button", class: "btn-primary two-line", onclick: () => actions.openSetup() },
      h("span", {}, S.start.setup),
      h("small", {}, S.start.setupSub),
    ),
    knowBtn,
    h(
      "button",
      { type: "button", class: "link-btn", onclick: () => actions.skipOnboarding("tones") },
      S.start.tonesOnly,
    ),
  );
  const languageGroup = h(
    "div",
    { class: "segmented start-language", role: "group", "aria-label": S.a11y.language },
    ...languages,
  );

  const el = h(
    "section",
    { class: "screen start", "aria-labelledby": "start-title" },
    languageGroup,
    icons.logo(104),
    h("h1", { id: "start-title" }, S.appName),
    first,
    returning,
    h("div", { class: "privacy" }, icons.shield(), h("span", {}, S.start.privacy)),
  );

  function render(st: AppState): void {
    const onboarded = st.settings.onboarded;
    setHidden(first, onboarded);
    setHidden(languageGroup, onboarded);
    setHidden(returning, !onboarded);
    startBtn.disabled = st.micState === "starting";
    knowBtn.disabled = st.micState === "starting";
    languages.forEach((b) =>
      setAttr(b, "aria-pressed", String(document.documentElement.lang === b.lang)),
    );
  }
  store.subscribe((st, prev) => {
    if (st.settings !== prev.settings || st.micState !== prev.micState) render(st);
  });
  render(store.get());
  return el;
}
