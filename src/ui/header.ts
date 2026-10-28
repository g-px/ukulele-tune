import type { Actions } from "../state/app-state";
import { S } from "../strings";
import { h } from "./dom";
import { icons } from "./icons";

export function appHeader(actions: Actions, opts: { settings?: boolean } = {}): HTMLElement {
  return h(
    "header",
    { class: "header" },
    h("p", { class: "brand" }, icons.logo(), S.appName),
    h(
      "div",
      { class: "header-actions" },
      h(
        "button",
        {
          type: "button",
          class: "icon-btn",
          "aria-label": S.help,
          onclick: () => actions.navigate("help"),
        },
        icons.help(),
      ),
      opts.settings === false
        ? null
        : h(
            "button",
            {
              type: "button",
              class: "icon-btn",
              "aria-label": S.settings,
              onclick: () => actions.navigate("settings"),
            },
            icons.gear(),
          ),
    ),
  );
}

export function titleRow(title: string, actions: Actions): HTMLElement {
  return h(
    "div",
    { class: "title-row" },
    h(
      "button",
      { type: "button", class: "icon-btn", "aria-label": S.back, onclick: () => actions.back() },
      icons.back(),
    ),
    h("h1", { class: "screen-title" }, title),
  );
}
