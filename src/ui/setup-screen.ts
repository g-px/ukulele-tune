/** Beginner setup wizard, artboards 9–13 (beginner-setup.md §6). */
import type { GLook, UkeSize } from "../core/identify";
import { midiToFreq, nearestMidi, noteName, prettyAccidentals, solfege } from "../core/pitch-math";
import { getTuning } from "../core/tunings";
import type { Actions, AppState } from "../state/app-state";
import { canGoNext, listenSameNote, result, stepNumber, type SetupState } from "../state/setup";
import type { Store } from "../state/store";
import { S, tuningName } from "../strings";
import { h, setHidden, setText, type Child } from "./dom";
import { icons } from "./icons";
import { gaugeLine, holdDrawing, sizeSilhouette, stringPair, stringsStrip } from "./illustrations";

type KnownSize = Exclude<UkeSize, "unknown">;

/** Overall length and drawing scale per size (docs/knowledge/01-ukulele.md). */
const SIZES: ReadonlyArray<{ id: KnownSize; cm: number; inches: number; scale: number }> = [
  { id: "soprano", cm: 53, inches: 21, scale: 0.7 },
  { id: "concert", cm: 58, inches: 23, scale: 0.76 },
  { id: "tenor", cm: 66, inches: 26, scale: 0.87 },
  { id: "baritone", cm: 76, inches: 30, scale: 1 },
];

function lead(title: string, text?: string): HTMLElement {
  return h(
    "div",
    { class: "setup-lead" },
    h("h1", { tabindex: -1 }, title),
    text ? h("p", {}, text) : null,
  );
}

function infoCard(text: string, tone: "info" | "warn" = "info"): HTMLElement {
  return h(
    "div",
    { class: `setup-note ${tone}` },
    tone === "warn" ? icons.warning(18) : icons.info(),
    h("span", {}, text),
  );
}

function choice(
  pressed: boolean,
  onclick: () => void,
  className: string,
  ...children: Child[]
): HTMLButtonElement {
  return h(
    "button",
    { type: "button", class: className, "aria-pressed": String(pressed), onclick },
    ...children,
  );
}

function holdStep(st: AppState, actions: Actions): Child[] {
  const T = S.setup.hold;
  const left = st.settings.leftHanded;
  const toggle = h("input", {
    id: "setup-lefty",
    type: "checkbox",
    role: "switch",
    class: "switch",
    onchange: (e: Event) =>
      actions.updateSettings({ leftHanded: (e.target as HTMLInputElement).checked }),
  });
  toggle.checked = left;
  const bullet = (n: number, ...text: Child[]) =>
    h("li", {}, h("span", { class: "bullet-num" }, n), h("span", {}, ...text));
  return [
    lead(T.title),
    h(
      "div",
      { class: "hold-card" },
      h("span", { class: "hold-dir" }, T.face),
      holdDrawing(T.drawing, T.head, T.strum, left),
      h("span", { class: "hold-dir" }, T.floor),
    ),
    h(
      "ul",
      { class: "setup-bullets" },
      bullet(1, left ? T.b1Left : T.b1),
      bullet(2, T.b2),
      bullet(3, T.b3),
    ),
    h(
      "div",
      { class: "setting-row" },
      h(
        "label",
        { class: "setting-text", for: "setup-lefty" },
        h("span", { class: "setting-label" }, T.lefty),
        h("span", { class: "setting-hint" }, T.leftySub),
      ),
      toggle,
    ),
  ];
}

function sizeStep(setup: SetupState, actions: Actions): Child[] {
  const T = S.setup.size;
  const pick = (size: UkeSize) => () => actions.setupAnswer({ size });
  return [
    lead(T.title, T.lead),
    h(
      "div",
      { class: "choices", role: "group", "aria-label": T.group },
      ...SIZES.map((sz) => {
        const tuning = getTuning(sz.id === "baritone" ? "baritone" : "c-high-g");
        const letters = tuning.strings.map((x) => noteName(x.midi).letter).join(" ");
        return choice(
          setup.size === sz.id,
          pick(sz.id),
          "choice size-choice",
          sizeSilhouette(sz.scale),
          h(
            "span",
            { class: "choice-text" },
            h("span", { class: "choice-title" }, T.names[sz.id]),
            h("span", { class: "choice-sub" }, T.length(sz.cm, sz.inches)),
          ),
          h("span", { class: `choice-tag${sz.id === "baritone" ? " warn" : ""}` }, letters),
        );
      }),
      choice(setup.size === "unknown", pick("unknown"), "choice unsure", T.unsure),
    ),
    infoCard(T.info),
  ];
}

function lookStep(setup: SetupState, actions: Actions): Child[] {
  const T = S.setup.look;
  const pick = (look: GLook) => () => actions.setupAnswer({ look });
  return [
    lead(T.title, T.lead),
    h(
      "div",
      { class: "choices", role: "group", "aria-label": T.group },
      choice(
        setup.look === "thin",
        pick("thin"),
        "choice look-choice",
        stringPair("thin"),
        h(
          "span",
          { class: "look-row" },
          h("span", { class: "choice-title" }, T.thin),
          h("span", { class: "tag accent" }, T.thinTag),
        ),
      ),
      choice(
        setup.look === "thick",
        pick("thick"),
        "choice look-choice",
        stringPair("thick"),
        h(
          "span",
          { class: "look-row" },
          h(
            "span",
            { class: "choice-text" },
            h("span", { class: "choice-title" }, T.thick),
            h("span", { class: "choice-sub" }, T.thickSub),
          ),
          h("span", { class: "tag" }, T.thickTag),
        ),
      ),
      choice(setup.look === "unknown", pick("unknown"), "choice unsure", T.unsure),
    ),
    infoCard(T.warn, "warn"),
  ];
}

function slot(
  n: number,
  hz: number | null,
  active: boolean,
  a4: number,
  level: HTMLElement | null,
) {
  const T = S.setup.listen;
  const state = hz !== null ? "done" : active ? "active" : "waiting";
  const note = hz !== null ? prettyAccidentals(noteName(nearestMidi(hz, a4)).label) : "—";
  return h(
    "li",
    { class: `slot ${state}` },
    h(
      "span",
      { class: "slot-row" },
      h(
        "span",
        { class: "slot-icon" },
        state === "done" ? icons.check(20) : state === "active" ? icons.mic(18) : null,
      ),
      h(
        "span",
        { class: "slot-text" },
        h("span", { class: "slot-title" }, T.string(n)),
        h(
          "span",
          { class: "slot-sub" },
          state === "done" ? T.heard : state === "active" ? T.now : T.waiting,
        ),
      ),
      h(
        "span",
        { class: "slot-note num" },
        note,
        hz !== null ? h("small", {}, ` ${Math.round(hz)} Hz`) : null,
      ),
    ),
    state === "active" && level ? h("span", { class: "slot-level" }, level) : null,
  );
}

function listenStep(
  st: AppState,
  setup: SetupState,
  actions: Actions,
  levelFill: HTMLElement,
): Child[] {
  const T = S.setup.listen;
  const l = setup.listen;
  const running = st.micState === "running";
  const parts: Child[] = [lead(T.title, T.lead)];
  if (!running) {
    if (l.skipped) parts.push(infoCard(T.noMic, "warn"));
    else {
      parts.push(
        h(
          "button",
          {
            type: "button",
            class: "btn-secondary",
            disabled: st.micState === "starting",
            onclick: () => actions.setupListenStart(),
          },
          icons.mic(20),
          T.start,
        ),
      );
    }
    parts.push(infoCard(T.info), h("p", { class: "footnote" }, T.privacy));
    return parts;
  }
  const active = l.string4Hz === null ? 4 : l.string3Hz === null ? 3 : null;
  const done = [l.string4Hz !== null ? 4 : 0, l.string3Hz !== null ? 3 : 0].filter(Boolean);
  parts.push(
    stringsStrip(active, done, T.drawing(active ?? 3)),
    h(
      "ol",
      { class: "slots", "aria-live": "polite" },
      slot(4, l.string4Hz, active === 4, st.settings.a4, levelFill),
      slot(3, l.string3Hz, active === 3, st.settings.a4, levelFill),
    ),
  );
  if (listenSameNote(l)) parts.push(infoCard(T.same, "warn"));
  else parts.push(infoCard(T.info));
  parts.push(
    h(
      "button",
      { type: "button", class: "btn-ghost", onclick: () => actions.setupListenRestart() },
      T.restart,
    ),
    h("p", { class: "footnote" }, T.privacy),
  );
  return parts;
}

function why(setup: SetupState): string {
  const W = S.setup.result.why;
  const r = result(setup);
  const high = r.tuningId === "c-high-g";
  if (r.conflict !== "none") return W.conflict;
  if (r.basis === "size") return W.size;
  if (r.basis === "default") return W.default;
  if (r.basis === "look") return W.look(high);
  if (r.tuningId === "baritone") return W.listenBaritone;
  const agrees = (high && setup.look === "thin") || (!high && setup.look === "thick");
  return agrees ? W.listenLook(high) : W.listen(high);
}

function stringMap(tuningId: string, a4: number): HTMLElement {
  const T = S.setup.result;
  const tuning = getTuning(tuningId);
  const midis = tuning.strings.map((x) => x.midi);
  const lo = Math.min(...midis);
  const hi = Math.max(...midis);
  return h(
    "ul",
    { class: "string-map", "aria-label": T.mapLabel },
    ...tuning.strings.map((str) => {
      const name = noteName(str.midi);
      const hz = Math.round(midiToFreq(str.midi, a4));
      const hint =
        str.number === 4 ? T.face : str.number === 1 ? T.floor : str.midi === lo ? T.lowest : null;
      const width = hi === lo ? 2.4 : 3.4 - ((str.midi - lo) / (hi - lo)) * 1.6;
      return h(
        "li",
        {},
        h("span", { class: `map-num${str.number === 4 ? " first" : ""}` }, str.number),
        h(
          "span",
          { class: "map-letter" },
          prettyAccidentals(name.letter),
          S.showSolfege ? h("small", {}, solfege(name.letter)) : null,
        ),
        h(
          "span",
          { class: "map-sub num" },
          `${prettyAccidentals(name.label)} · ${hz} Hz`,
          hint ? h("br") : null,
          hint,
        ),
        gaugeLine(width),
      );
    }),
  );
}

function resultStep(st: AppState, setup: SetupState, actions: Actions): Child[] {
  const T = S.setup.result;
  const r = result(setup);
  const tuning = getTuning(r.tuningId);
  const size = setup.size && setup.size !== "unknown" ? S.setup.size.names[setup.size] : "";
  const letters = tuning.strings.map((x) => prettyAccidentals(noteName(x.midi).letter)).join(" ");
  const conflict = r.conflict !== "none";
  return [
    h(
      "div",
      { class: "result-card" },
      h(
        "div",
        { class: `result-status${conflict ? " warn" : ""}` },
        conflict ? icons.warning(16) : icons.check(16),
        conflict ? T.check : T.found,
      ),
      h("h1", { class: "result-headline", tabindex: -1 }, T.headline(size, r.tuningId)),
      h(
        "div",
        { class: "result-tuning" },
        `${T.tuningLine(tuningName(r.tuningId))} `,
        h("strong", {}, letters),
      ),
      h("p", {}, why(setup)),
    ),
    stringMap(r.tuningId, st.settings.a4),
    h(
      "div",
      { class: "tips" },
      h("span", {}, icons.arrowUp(18), h("span", {}, T.tip1)),
      h("span", {}, icons.retry(), h("span", {}, T.tip2)),
    ),
    conflict
      ? h(
          "button",
          {
            type: "button",
            class: "btn-secondary",
            onclick: () => {
              actions.setupBack();
              actions.setupListenRestart();
            },
          },
          T.again,
        )
      : null,
    h(
      "button",
      {
        type: "button",
        class: "btn-primary setup-cta",
        onclick: () => actions.setupFinish("guide"),
      },
      T.guide,
    ),
    h(
      "button",
      { type: "button", class: "link-btn", onclick: () => actions.setupFinish("settings") },
      T.manual,
    ),
  ];
}

export function setupScreen(store: Store<AppState>, actions: Actions): HTMLElement {
  const stepText = h("span", { class: "setup-step" });
  const skip = h("button", {
    type: "button",
    class: "link-btn",
    onclick: () => {
      if (store.get().setup?.step === "listen") actions.setupListenSkip();
      else actions.setupSkip();
    },
  });
  const segments = [0, 1, 2, 3].map(() => h("span"));
  const progress = h("div", { class: "progress", "aria-hidden": "true" }, ...segments);
  const body = h("div", { class: "setup-body" });
  const next = h("button", {
    type: "button",
    class: "btn-primary setup-cta",
    onclick: () => actions.setupNext(),
  });
  const levelFill = h("span", { class: "level-fill" });
  const el = h(
    "section",
    { class: "screen setup", "aria-label": S.setup.label },
    h(
      "div",
      { class: "setup-header" },
      h(
        "div",
        { class: "setup-header-left" },
        h(
          "button",
          {
            type: "button",
            class: "icon-btn",
            "aria-label": S.setup.back,
            onclick: () => actions.setupBack(),
          },
          icons.back(),
        ),
        stepText,
      ),
      skip,
    ),
    progress,
    body,
    next,
  );

  let signature = "";
  let lastStep: string | null = null;

  function build(st: AppState, setup: SetupState): void {
    const parts =
      setup.step === "hold"
        ? holdStep(st, actions)
        : setup.step === "size"
          ? sizeStep(setup, actions)
          : setup.step === "look"
            ? lookStep(setup, actions)
            : setup.step === "listen"
              ? listenStep(st, setup, actions, levelFill)
              : resultStep(st, setup, actions);
    body.replaceChildren();
    for (const p of parts) {
      if (p !== null && p !== undefined && p !== false)
        body.append(typeof p === "number" ? String(p) : p);
    }
    const isResult = setup.step === "result";
    setText(stepText, isResult ? S.setup.result.title : S.setup.step(stepNumber(setup.step)));
    setText(skip, S.setup.skip);
    setHidden(skip, isResult);
    setHidden(progress, isResult);
    setHidden(next, isResult);
    setText(next, S.setup.next);
    next.disabled = !canGoNext(setup);
    const n = stepNumber(setup.step);
    segments.forEach((seg, i) => seg.classList.toggle("on", i < n));
  }

  function render(st: AppState): void {
    const setup = st.setup;
    if (!setup || st.screen !== "setup") return;
    const sig = JSON.stringify([setup, st.settings.leftHanded, st.micState, st.settings.a4]);
    if (sig !== signature) {
      signature = sig;
      build(st, setup);
    }
    levelFill.style.transform = `scaleX(${st.reading.level.toFixed(2)})`;
    if (setup.step !== lastStep) {
      lastStep = setup.step;
      body.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }

  store.subscribe((st) => render(st));
  return el;
}
