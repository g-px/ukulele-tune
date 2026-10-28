import type { StringNumber } from "../core/tunings";
import type { Actions } from "../state/app-state";
import type { StringView } from "../state/derive";
import { S } from "../strings";
import { h, setAttr, setClass, setHidden, setText } from "./dom";
import { icons } from "./icons";

interface Column {
  number: StringNumber;
  btn: HTMLButtonElement;
  letter: HTMLElement;
  sub: HTMLElement;
  lock: HTMLElement;
  tone: HTMLButtonElement;
  toneOn: boolean | undefined;
}

export function createStringsPanel(actions: Actions) {
  const el = h("div", { class: "strings", role: "group", "aria-label": "Strings" });
  let columns: Column[] = [];
  let signature = "";

  function build(views: StringView[]): void {
    columns = views.map((v) => {
      const letter = h("span", { class: "letter" });
      const sub = h("span", { class: "sub num" });
      const lock = h("span", { class: "lock", hidden: true }, icons.lock());
      const btn = h(
        "button",
        {
          type: "button",
          class: "string-btn",
          "aria-pressed": "false",
          onclick: () => actions.toggleString(v.number),
        },
        letter,
        sub,
        lock,
      );
      const tone = h("button", {
        type: "button",
        class: "tone-btn",
        "aria-pressed": "false",
        onclick: () => actions.toggleTone(v.number),
      });
      el.append(h("div", { class: "string-col" }, btn, tone));
      return { number: v.number, btn, letter, sub, lock, tone, toneOn: undefined };
    });
  }

  function update(views: StringView[]): void {
    const sig = views.map((v) => `${v.number}:${v.noteLabel}:${v.sub}`).join("|");
    if (sig !== signature) {
      signature = sig;
      el.replaceChildren();
      build(views);
    }
    views.forEach((v, i) => {
      const c = columns[i];
      if (!c) return;
      setText(c.letter, v.letter);
      setText(c.sub, v.sub);
      setAttr(c.btn, "aria-label", S.stringButton(v.noteLabel, v.hz));
      setAttr(c.btn, "aria-pressed", String(v.locked));
      setClass(c.btn, "is-current", v.current);
      setClass(c.btn, "is-warn", v.warn);
      setHidden(c.lock, !v.locked);
      if (c.toneOn !== v.tone) {
        c.toneOn = v.tone;
        c.tone.replaceChildren(v.tone ? icons.stop() : icons.play());
        setAttr(c.tone, "aria-pressed", String(v.tone));
        setAttr(c.tone, "aria-label", v.tone ? S.stopTone(v.noteLabel) : S.playTone(v.noteLabel));
      }
    });
  }

  return { el, update };
}
