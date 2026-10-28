import type { Actions, AppState } from "../state/app-state";
import type { Store } from "../state/store";
import { S } from "../strings";
import { h } from "./dom";
import { icons } from "./icons";

export function startScreen(store: Store<AppState>, actions: Actions): HTMLElement {
  const startBtn = h(
    "button",
    { type: "button", class: "btn-primary", onclick: () => actions.startMic() },
    icons.mic(22),
    S.start.startTuner,
  );
  const el = h(
    "section",
    { class: "screen start", "aria-labelledby": "start-title" },
    icons.logo(120),
    h(
      "div",
      { style: "display:flex;flex-direction:column;align-items:center;gap:8px" },
      h("h1", { id: "start-title" }, S.appName),
      h("p", {}, S.start.instruction),
    ),
    startBtn,
    h(
      "button",
      { type: "button", class: "btn-secondary", onclick: () => actions.startTonesOnly() },
      S.start.tonesOnly,
    ),
    h("div", { class: "privacy" }, icons.shield(), h("span", {}, S.start.privacy)),
  );
  store.subscribe((st, prev) => {
    if (st.micState !== prev.micState) startBtn.disabled = st.micState === "starting";
  });
  return el;
}
