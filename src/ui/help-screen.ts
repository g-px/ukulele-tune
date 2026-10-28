import { version } from "../../package.json";
import type { Actions } from "../state/app-state";
import { S } from "../strings";
import { h } from "./dom";
import { titleRow } from "./header";
import { icons } from "./icons";

export function helpScreen(actions: Actions): HTMLElement {
  return h(
    "section",
    { class: "screen help", "aria-label": S.help, style: "gap:16px" },
    titleRow(S.help, actions),
    ...S.helpScreen.sections.map((sec) =>
      h(
        "article",
        { class: "help-card" },
        h("h2", {}, sec.title),
        "steps" in sec
          ? h("ol", {}, ...sec.steps.map((step) => h("li", {}, step)))
          : h("p", {}, sec.body),
      ),
    ),
    h(
      "div",
      { class: "help-footer" },
      icons.shield(),
      h("span", {}, S.helpScreen.privacy(`${version} (${__BUILD__})`)),
    ),
  );
}
