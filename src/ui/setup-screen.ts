import type { Actions, AppState } from "../state/app-state";
import type { Store } from "../state/store";
import { h } from "./dom";

/** Beginner setup wizard (artboards 9–13). Filled in by T33–T35. */
export function setupScreen(_store: Store<AppState>, _actions: Actions): HTMLElement {
  return h("section", { class: "screen setup" });
}
