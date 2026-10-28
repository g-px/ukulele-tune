import "./styles.css";
import { createEngine } from "./engine";
import { initialState } from "./state/app-state";
import { browserStorage, loadSettings } from "./state/settings";
import { createStore } from "./state/store";
import { mountApp } from "./ui/app";

const root = document.getElementById("app");
if (root) {
  const storage = browserStorage();
  const store = createStore(initialState(loadSettings(storage)));
  const actions = createEngine(store, storage);
  mountApp(root, store, actions);
}
