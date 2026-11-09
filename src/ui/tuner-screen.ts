import { TUNINGS, getTuning } from "../core/tunings";
import type { Actions, AppState } from "../state/app-state";
import {
  guideView,
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
import { S, tuningName } from "../strings";
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
    ...TUNINGS.map((t) => h("option", { value: t.id }, `${tuningName(t.id)} · ${t.short}`)),
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

  const header = appHeader(actions);
  const guideRound = h("span", { class: "guide-round" });
  const guideHeader = h(
    "header",
    { class: "header", hidden: true },
    h(
      "div",
      { class: "setup-header-left" },
      h(
        "button",
        {
          type: "button",
          class: "icon-btn",
          "aria-label": S.guide.leave,
          onclick: () => actions.guideExit(),
        },
        icons.close(),
      ),
      h("p", { class: "brand" }, S.guide.title),
    ),
    guideRound,
  );
  const guideStep = h("span", { class: "guide-step" });
  const guidePills = [0, 1, 2, 3].map(() => h("span"));
  const guideTitle = h("div", { class: "guide-title" });
  const guideHint = h("div", { class: "guide-hint" });
  const guideButtons = h(
    "div",
    { class: "guide-buttons", hidden: true },
    h(
      "button",
      { type: "button", class: "btn-secondary", onclick: () => actions.guideAgain() },
      S.guide.again,
    ),
    h(
      "button",
      { type: "button", class: "btn-primary", onclick: () => actions.guideExit() },
      S.guide.finish,
    ),
  );
  const guideCard = h(
    "div",
    { class: "guide-card", hidden: true, "aria-live": "polite" },
    h(
      "div",
      { class: "guide-top" },
      guideStep,
      h("span", { class: "guide-pills", "aria-hidden": "true" }, ...guidePills),
    ),
    guideTitle,
    guideHint,
    guideButtons,
  );
  const guideFooter = h(
    "div",
    { class: "guide-footer", hidden: true },
    h("span", {}, S.guide.footer),
    h(
      "button",
      { type: "button", class: "btn-ghost", onclick: () => actions.guideSkipString() },
      S.guide.skip,
    ),
  );
  const wrongWay = h(
    "div",
    { class: "wrong-way", role: "alert", hidden: true },
    icons.turn(),
    h("span", {}, h("strong", {}, S.guide.wrongWayStrong), " ", h("span", { class: "ww-text" })),
  );
  const wrongWayText = wrongWay.querySelector<HTMLElement>(".ww-text") ?? h("span");
  const modeRow = h(
    "div",
    { class: "mode-row" },
    h(
      "div",
      { class: "segmented", role: "group", "aria-label": S.a11y.mode },
      autoBtn,
      chromaticBtn,
    ),
    lockNote,
  );
  const tuningRow = h(
    "div",
    { class: "tuning-row" },
    h("label", { for: "tuning", class: "visually-hidden" }, S.tuning),
    select,
    badge,
  );

  const levelFill = h("div", { class: "level-fill" });
  const status = h("div", { class: "status" });
  const debug = h("pre", { class: "debug", hidden: true });
  const live = h("div", { class: "visually-hidden", "aria-live": "polite", role: "status" });

  const el = h(
    "section",
    { class: "screen tuner", "aria-label": S.a11y.tuner },
    header,
    guideHeader,
    tuningRow,
    guideCard,
    note.el,
    octaveCard,
    wrongWay,
    needle.el,
    strings.el,
    modeRow,
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
            "aria-label": S.a11y.micLevel,
            "aria-valuemin": 0,
            "aria-valuemax": 100,
            "aria-valuenow": 0,
          },
          levelFill,
        ),
      ),
      status,
      guideFooter,
    ),
    debug,
    live,
  );

  let lastLevel = -1;
  let lastAnnounce = "";
  let lastAnnounceAt = 0;

  function render(st: AppState, prev: AppState | null): void {
    if (st.screen !== "tuner") return;
    renderGuide(st);
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

  function renderGuide(st: AppState): void {
    const g = guideView(st);
    setClass(el, "is-guided", g.visible);
    setHidden(header, g.visible);
    setHidden(guideHeader, !g.visible);
    setHidden(tuningRow, g.visible);
    setHidden(modeRow, g.visible);
    setHidden(guideCard, !g.visible);
    setHidden(guideFooter, !g.visible || g.done);
    setHidden(wrongWay, !st.wrongWay);
    if (st.wrongWay) setText(wrongWayText, S.guide.wrongWay(currentLetter(st)));
    if (!g.visible) return;
    setText(guideRound, g.round);
    setClass(guideCard, "is-done", g.done);
    setHidden(guideStep, g.done);
    setText(guideStep, g.step);
    guidePills.forEach((p, i) => setClass(p, "on", i <= g.index));
    setText(guideTitle, g.title);
    setText(guideHint, g.done ? S.guide.doneBody : g.hint);
    setHidden(guideButtons, !g.done);
  }

  store.subscribe((st, prev) => render(st, prev));
  render(store.get(), null);
  // Validate the configured tuning at startup so a bad id fails loudly in dev.
  getTuning(store.get().settings.tuningId);
  return el;
}

/** Letter of the string guided tuning is on, for the wrong-way hint. */
function currentLetter(st: AppState): string {
  const view = stringViews(st).find((v) => v.locked);
  return view ? view.letter : "";
}
