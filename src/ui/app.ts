import type { Actions, AppState, Screen } from "../state/app-state";
import type { Store } from "../state/store";
import { helpScreen } from "./help-screen";
import { micErrorScreen } from "./mic-error-screen";
import { settingsScreen } from "./settings-screen";
import { startScreen } from "./start-screen";
import { tunerScreen } from "./tuner-screen";

/** Mount every screen once and show the active one. */
export function mountApp(root: HTMLElement, store: Store<AppState>, actions: Actions): void {
  const screens: Record<Screen, HTMLElement> = {
    start: startScreen(store, actions),
    tuner: tunerScreen(store, actions),
    settings: settingsScreen(store, actions),
    help: helpScreen(actions),
    "mic-error": micErrorScreen(store, actions),
  };
  root.replaceChildren(...Object.values(screens));

  function show(screen: Screen): void {
    for (const [name, el] of Object.entries(screens)) el.hidden = name !== screen;
    window.scrollTo(0, 0);
    const heading = screens[screen].querySelector<HTMLElement>("h1, .brand");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }
  store.subscribe((st, prev) => {
    if (st.screen !== prev.screen) show(st.screen);
  });
  for (const [name, el] of Object.entries(screens)) el.hidden = name !== store.get().screen;
}
