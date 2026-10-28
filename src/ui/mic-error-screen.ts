import type { MicError } from "../audio/mic-errors";
import type { Actions, AppState } from "../state/app-state";
import type { Store } from "../state/store";
import { S } from "../strings";
import { h, setText } from "./dom";
import { appHeader } from "./header";
import { icons } from "./icons";

export function micErrorScreen(store: Store<AppState>, actions: Actions): HTMLElement {
  const title = h("h1", { id: "mic-error-title" });
  const cause = h("p");
  const fixes = h("ol", { class: "fix-list" });
  const el = h(
    "section",
    { class: "screen mic-error", "aria-labelledby": "mic-error-title", style: "gap:16px" },
    appHeader(actions, { settings: false }),
    h("div", { class: "error-card" }, icons.micOff(), title, cause),
    h(
      "div",
      { style: "display:flex;flex-direction:column;gap:10px" },
      h("h2", { class: "section-label" }, S.micError.fixTitle),
      fixes,
    ),
    h(
      "button",
      {
        type: "button",
        class: "btn-primary",
        style: "height:56px;font-size:17px;margin-top:8px",
        onclick: () => actions.startMic(),
      },
      S.micError.retry,
    ),
    h(
      "button",
      { type: "button", class: "btn-secondary", onclick: () => actions.startTonesOnly() },
      icons.play(),
      S.start.tonesOnly,
    ),
    h("p", { class: "footnote" }, S.micError.ringer),
  );

  let shown: MicError | null = null;
  function render(st: AppState): void {
    const err = st.micError ?? "unknown";
    if (err === shown) return;
    shown = err;
    setText(title, S.micError.title[err]);
    setText(cause, S.micError.cause[err]);
    fixes.replaceChildren(...S.micError.fixes[err].map((f) => h("li", {}, f)));
  }
  store.subscribe((st) => render(st));
  render(store.get());
  return el;
}
