import { A4_MAX, A4_MIN, GATE_MAX_DBFS, GATE_MIN_DBFS } from "../config";
import { TUNINGS } from "../core/tunings";
import type { Actions, AppState } from "../state/app-state";
import type { Settings } from "../state/settings";
import type { Store } from "../state/store";
import { S } from "../strings";
import { h, setAttr, setText } from "./dom";
import { titleRow } from "./header";

const T = S.settingsScreen;

function segmented<V extends string | number | boolean>(
  label: string,
  options: Array<[V, string]>,
  pick: (v: V) => void,
) {
  const buttons = options.map(([value, text]) =>
    h("button", { type: "button", "aria-pressed": "false", onclick: () => pick(value) }, text),
  );
  const el = h("div", { class: "segmented", role: "group", "aria-label": label }, ...buttons);
  return {
    el,
    update(current: V) {
      buttons.forEach((b, i) => setAttr(b, "aria-pressed", String(options[i]?.[0] === current)));
    },
  };
}

function row(label: string, hint: string | null, control: Node, forId?: string): HTMLElement {
  return h(
    "div",
    { class: "setting-row" },
    h(
      "div",
      { class: "setting-text" },
      forId
        ? h("label", { class: "setting-label", for: forId }, label)
        : h("span", { class: "setting-label" }, label),
      hint ? h("span", { class: "setting-hint" }, hint) : null,
    ),
    control,
  );
}

export function settingsScreen(store: Store<AppState>, actions: Actions): HTMLElement {
  const set = (patch: Partial<Settings>) => actions.updateSettings(patch);

  const tuning = h(
    "select",
    {
      id: "s-tuning",
      class: "select",
      onchange: (e: Event) => set({ tuningId: (e.target as HTMLSelectElement).value }),
    },
    ...TUNINGS.map((t) => h("option", { value: t.id }, `${t.name} · ${t.short}`)),
  );

  const a4Input = h("input", {
    id: "s-a4",
    type: "number",
    inputmode: "numeric",
    class: "num",
    min: A4_MIN,
    max: A4_MAX,
    step: 1,
    onchange: (e: Event) => {
      const v = Number((e.target as HTMLInputElement).value);
      if (Number.isFinite(v)) set({ a4: v });
    },
  });
  const a4 = h(
    "div",
    { class: "stepper" },
    h(
      "button",
      {
        type: "button",
        "aria-label": T.a4Down,
        onclick: () => set({ a4: store.get().settings.a4 - 1 }),
      },
      "−",
    ),
    a4Input,
    h(
      "button",
      {
        type: "button",
        "aria-label": T.a4Up,
        onclick: () => set({ a4: store.get().settings.a4 + 1 }),
      },
      "+",
    ),
  );

  const windowSeg = segmented<3 | 5>(
    T.window,
    [
      [5, "±5"],
      [3, "±3"],
    ],
    (v) => set({ inTuneCents: v }),
  );
  const namesSeg = segmented<boolean>(
    T.names,
    [
      [false, T.sharps],
      [true, T.flats],
    ],
    (v) => set({ flats: v }),
  );
  const left = h("input", {
    id: "s-left",
    type: "checkbox",
    role: "switch",
    class: "switch",
    onchange: (e: Event) => set({ leftHanded: (e.target as HTMLInputElement).checked }),
  });
  const themeSeg = segmented<Settings["theme"]>(
    T.theme,
    [
      ["system", T.themeSystem],
      ["light", T.themeLight],
      ["dark", T.themeDark],
    ],
    (v) => set({ theme: v }),
  );
  const bufferSeg = segmented<Settings["bufferSize"]>(
    T.bufferSize,
    [
      [2048, "2048"],
      [4096, "4096"],
    ],
    (v) => set({ bufferSize: v }),
  );
  const gateValue = h("span", { class: "setting-hint num" });
  const gate = h("input", {
    id: "s-gate",
    type: "range",
    min: GATE_MIN_DBFS,
    max: GATE_MAX_DBFS,
    step: 1,
    oninput: (e: Event) => set({ gateDbfs: Number((e.target as HTMLInputElement).value) }),
  });

  const el = h(
    "section",
    { class: "screen settings", "aria-label": S.settings, style: "gap:14px" },
    titleRow(S.settings, actions),
    h(
      "div",
      { style: "display:flex;flex-direction:column;gap:8px" },
      h("label", { class: "field-label", for: "s-tuning" }, S.tuning),
      tuning,
    ),
    row(T.a4, T.a4Hint, a4, "s-a4"),
    row(T.window, T.windowHint, windowSeg.el),
    row(T.names, null, namesSeg.el),
    row(T.left, T.leftHint, left, "s-left"),
    row(T.theme, null, themeSeg.el),
    h("h2", { class: "section-label" }, T.advanced),
    row(T.bufferSize, T.bufferHint, bufferSeg.el),
    h(
      "div",
      { class: "setting-row stack" },
      h(
        "div",
        { class: "range-head" },
        h("label", { class: "setting-label", for: "s-gate" }, T.gate),
        gateValue,
      ),
      gate,
    ),
    h(
      "button",
      { type: "button", class: "btn-ghost", onclick: () => actions.resetSettings() },
      T.reset,
    ),
  );

  function render(st: AppState): void {
    const s = st.settings;
    if (tuning.value !== s.tuningId) tuning.value = s.tuningId;
    if (document.activeElement !== a4Input && a4Input.value !== String(s.a4)) {
      a4Input.value = String(s.a4);
    }
    windowSeg.update(s.inTuneCents);
    namesSeg.update(s.flats);
    left.checked = s.leftHanded;
    themeSeg.update(s.theme);
    bufferSeg.update(s.bufferSize);
    if (gate.value !== String(s.gateDbfs)) gate.value = String(s.gateDbfs);
    setText(gateValue, `${s.gateDbfs < 0 ? "−" : ""}${Math.abs(s.gateDbfs)} dB`);
  }
  store.subscribe((st, prev) => {
    if (st.settings !== prev.settings || st.screen !== prev.screen) render(st);
  });
  render(store.get());
  return el;
}
