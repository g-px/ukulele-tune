import { TUNINGS, getTuning } from "../core/tunings";
import type { Actions, AppState } from "../state/app-state";
import {
  announcement,
  needleLabel,
  needleState,
  noteView,
  octaveView,
  statusMessage,
  stringViews,
} from "../state/derive";
import type { Store } from "../state/store";
import { ANNOUNCE_INTERVAL_MS } from "../config";
import { S } from "../strings";
import { h, setAttr, setClass, setHidden, setText } from "./dom";
import { appHeader } from "./header";
import { icons } from "./icons";
import { createNeedle } from "./needle";
import { createNoteDisplay } from "./note-display";
import { createStringsPanel } from "./strings-panel";

export function tunerScreen(store: Store<AppState>, actions: Actions): HTMLElement {
  const select = h(
    "select",
    {
      id: "tuning",
      class: "select",
      onchange: (e: Event) =>
        actions.updateSettings({ tuningId: (e.target as HTMLSelectElement).value }),
    },
    ...TUNINGS.map((t) => h("option", { value: t.id }, `${t.name} · ${t.short}`)),
  );
  const badge = h("button", {
    type: "button",
    class: "badge num",
    hidden: true,
    onclick: () => actions.navigate("settings"),
  });

  const note = createNoteDisplay();
  const needle = createNeedle();
  const strings = createStringsPanel(actions);

  const octaveTitle = h("strong");
  const octaveBody = h("span");
  const octaveBtn = h("button", { type: "button" });
  let switchTo: string | null = null;
  octaveBtn.addEventListener("click", () => {
    if (switchTo) actions.updateSettings({ tuningId: switchTo });
  });
  const octaveCard = h(
    "div",
    { class: "octave-card", hidden: true, role: "alert" },
    icons.warning(),
    h("div", { class: "body" }, h("div", {}, octaveTitle, " ", octaveBody), octaveBtn),
  );

  const autoBtn = h(
    "button",
    { type: "button", onclick: () => actions.setMode({ kind: "auto" }) },
    S.modeAuto,
  );
  const chromaticBtn = h(
    "button",
    { type: "button", onclick: () => actions.setMode({ kind: "chromatic" }) },
    S.modeChromatic,
  );
  const lockNote = h("div", { class: "lock-note", hidden: true });

  const levelFill = h("div", { class: "level-fill" });
  const status = h("div", { class: "status" });
  const debug = h("pre", { class: "debug", hidden: true });
  const live = h("div", { class: "visually-hidden", "aria-live": "polite", role: "status" });

  const el = h(
    "section",
    { class: "screen tuner", "aria-label": "Tuner" },
    appHeader(actions),
    h(
      "div",
      { class: "tuning-row" },
      h("label", { for: "tuning", class: "visually-hidden" }, S.tuning),
      select,
      badge,
    ),
    note.el,
    octaveCard,
    needle.el,
    strings.el,
    h(
      "div",
      { class: "mode-row" },
      h("div", { class: "segmented", role: "group", "aria-label": "Mode" }, autoBtn, chromaticBtn),
      lockNote,
    ),
    h(
      "div",
      { class: "footer" },
      h(
        "div",
        { class: "level" },
        icons.mic(),
        h(
          "div",
          {
            class: "level-bar",
            role: "meter",
            "aria-label": "Microphone level",
            "aria-valuemin": 0,
            "aria-valuemax": 100,
            "aria-valuenow": 0,
          },
          levelFill,
        ),
      ),
      status,
    ),
    debug,
    live,
  );

  let lastLevel = -1;
  let lastAnnounce = "";
  let lastAnnounceAt = 0;

  function render(st: AppState, prev: AppState | null): void {
    if (st.screen !== "tuner") return;
    const s = st.settings;
    if (select.value !== s.tuningId) select.value = s.tuningId;
    setHidden(badge, s.a4 === 440);
    setText(badge, S.a4Badge(s.a4));

    note.update(noteView(st));
    const v = noteView(st);
    needle.update({
      cents: st.reading.cents,
      state: needleState(st),
      stale: v.stale,
      inTuneCents: s.inTuneCents,
      label: needleLabel(st),
    });
    strings.update(stringViews(st));

    const oct = octaveView(st);
    setHidden(octaveCard, !oct.visible);
    setClass(el, "has-octave", oct.visible);
    if (oct.visible) {
      setText(octaveTitle, oct.title);
      setText(octaveBody, oct.body);
      switchTo = oct.switchTo;
      setHidden(octaveBtn, oct.switchLabel === null);
      setText(octaveBtn, oct.switchLabel ?? "");
    }

    if (!prev || st.mode !== prev.mode) {
      setAttr(autoBtn, "aria-pressed", String(st.mode.kind === "auto"));
      setAttr(chromaticBtn, "aria-pressed", String(st.mode.kind === "chromatic"));
    }
    const mode = st.mode;
    const lockedLetter =
      mode.kind === "manual"
        ? stringViews(st).find((x) => x.number === mode.stringNumber)?.letter
        : undefined;
    setHidden(lockNote, !lockedLetter);
    if (lockedLetter) setText(lockNote, S.locked(lockedLetter));

    const level = Math.round(st.reading.level * 100);
    if (level !== lastLevel) {
      lastLevel = level;
      levelFill.style.transform = `scaleX(${level / 100})`;
      levelFill.parentElement?.setAttribute("aria-valuenow", String(level));
    }
    setText(status, statusMessage(st));
    setHidden(debug, st.debugInfo === "");
    setText(debug, st.debugInfo);

    const text = announcement(st);
    if (text && text !== lastAnnounce && st.nowMs - lastAnnounceAt >= ANNOUNCE_INTERVAL_MS) {
      lastAnnounce = text;
      lastAnnounceAt = st.nowMs;
      setText(live, text);
    }
  }

  store.subscribe((st, prev) => render(st, prev));
  render(store.get(), null);
  // Validate the configured tuning at startup so a bad id fails loudly in dev.
  getTuning(store.get().settings.tuningId);
  return el;
}
