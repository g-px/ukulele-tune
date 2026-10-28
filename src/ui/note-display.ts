import type { NoteView } from "../state/derive";
import { S } from "../strings";
import { h, setClass, setText } from "./dom";
import { icons } from "./icons";

export function createNoteDisplay() {
  const label = h("div", { class: "note-label num" }, "—");
  const cents = h("div", { class: "note-cents num" });
  const pillIcon = h("span", { class: "pill-icon", style: "display:inline-flex" });
  const pillText = h("span");
  const pill = h("div", { class: "pill idle" }, pillIcon, pillText);
  const el = h("div", { class: "note is-idle" }, label, cents, pill);
  let lastPill: NoteView["pill"] | undefined;

  function update(v: NoteView): void {
    setText(label, v.label);
    setText(cents, v.cents);
    setClass(el, "is-idle", v.idle);
    setClass(el, "is-stale", v.stale);
    setClass(el, "is-out", v.pill === "tighten" || v.pill === "loosen");
    if (v.pill !== lastPill) {
      lastPill = v.pill;
      pill.className = `pill ${v.pill === null ? "idle" : v.pill === "in" ? "ok" : "warn"}`;
      pillIcon.replaceChildren(
        v.pill === "tighten" ? icons.arrowUp() : v.pill === "loosen" ? icons.arrowDown() : "",
      );
      setText(
        pillText,
        v.pill === "in"
          ? S.pill.inTune
          : v.pill === "tighten"
            ? S.pill.tighten
            : v.pill === "loosen"
              ? S.pill.loosen
              : "",
      );
    }
  }

  return { el, update };
}
