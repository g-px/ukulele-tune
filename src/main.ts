import "./styles.css";
import { createEngine } from "./engine";
import { registerServiceWorker } from "./pwa";
import { initialState } from "./state/app-state";
import { resolveLocale } from "./state/locale";
import { browserStorage, loadSettings } from "./state/settings";
import { createStore } from "./state/store";
import { setLocale } from "./strings";
import { mountApp } from "./ui/app";

const root = document.getElementById("app");
if (root) {
  const storage = browserStorage();
  const settings = loadSettings(storage);
  const locale = resolveLocale(settings.language, navigator.languages ?? [navigator.language]);
  setLocale(locale);
  document.documentElement.lang = locale;
  const store = createStore(initialState(settings));
  const actions = createEngine(store, storage);
  mountApp(root, store, actions);
}

registerServiceWorker();
