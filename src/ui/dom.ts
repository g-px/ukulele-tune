type Handler = (e: Event) => void;
type AttrValue = string | number | boolean | Handler | null | undefined;
export type Attrs = Record<string, AttrValue>;
export type Child = Node | string | number | null | undefined | false;

const SVG_NS = "http://www.w3.org/2000/svg";

function apply(el: Element, attrs: Attrs, children: Child[]): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "class") {
      el.setAttribute("class", String(value));
    } else {
      el.setAttribute(key, value === true ? "" : String(value));
    }
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === "number" ? String(c) : c);
  }
}

/** Create an HTML element. Attributes starting with "on" bind listeners. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  apply(el, attrs, children);
  return el;
}

/** Create an SVG element. */
export function s<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  apply(el, attrs, children);
  return el;
}

/** Set text only when it changed (cheap to call every frame). */
export function setText(el: Element, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}

export function setAttr(el: Element, name: string, value: string | null): void {
  if (value === null) {
    if (el.hasAttribute(name)) el.removeAttribute(name);
  } else if (el.getAttribute(name) !== value) {
    el.setAttribute(name, value);
  }
}

export function setHidden(el: HTMLElement | SVGElement, hidden: boolean): void {
  if (el.hasAttribute("hidden") !== hidden) el.toggleAttribute("hidden", hidden);
}

export function setClass(el: Element, name: string, on: boolean): void {
  if (el.classList.contains(name) !== on) el.classList.toggle(name, on);
}
