import { s } from "./dom";

type Shape = [keyof SVGElementTagNameMap, Record<string, string | number>];

function icon(size: number, shapes: Shape[], opts: { fill?: boolean; stroke?: number } = {}) {
  return s(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: opts.fill ? "currentColor" : "none",
      stroke: opts.fill ? "none" : "currentColor",
      "stroke-width": opts.stroke ?? 2,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
      focusable: "false",
    },
    ...shapes.map(([tag, attrs]) => s(tag, attrs)),
  );
}

export const icons = {
  logo(size = 28) {
    return s(
      "svg",
      { width: size, height: size, viewBox: "0 0 28 28", fill: "none", "aria-hidden": "true" },
      s("circle", { cx: 11, cy: 18, r: 8, stroke: "var(--accent)", "stroke-width": 2 }),
      s("circle", { cx: 11, cy: 18, r: 2.5, fill: "var(--accent)" }),
      s("path", {
        d: "M16 11 L25 2",
        stroke: "var(--accent)",
        "stroke-width": 2.5,
        "stroke-linecap": "round",
      }),
      s("path", {
        d: "M22 3 L26 7",
        stroke: "var(--accent)",
        "stroke-width": 2,
        "stroke-linecap": "round",
      }),
    );
  },
  help: (n = 22) =>
    icon(n, [
      ["circle", { cx: 12, cy: 12, r: 9 }],
      ["path", { d: "M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7" }],
      ["circle", { cx: 12, cy: 17, r: 0.6, fill: "currentColor" }],
    ]),
  gear: (n = 22) =>
    icon(n, [
      ["circle", { cx: 12, cy: 12, r: 3 }],
      [
        "path",
        {
          d: "M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
        },
      ],
    ]),
  back: (n = 22) => icon(n, [["path", { d: "M15 5l-7 7 7 7" }]], { stroke: 2.2 }),
  play: (n = 18) => icon(n, [["path", { d: "M8 5v14l11-7z" }]], { fill: true }),
  stop: (n = 18) =>
    icon(n, [["rect", { x: 6, y: 6, width: 12, height: 12, rx: 2 }]], { fill: true }),
  mic: (n = 18) =>
    icon(n, [
      ["rect", { x: 9, y: 3, width: 6, height: 11, rx: 3 }],
      ["path", { d: "M5 11a7 7 0 0 0 14 0M12 18v3" }],
    ]),
  micOff: (n = 56) =>
    icon(
      n,
      [
        ["rect", { x: 9, y: 3, width: 6, height: 11, rx: 3 }],
        ["path", { d: "M5 11a7 7 0 0 0 14 0M12 18v3" }],
        ["path", { d: "M3 3l18 18" }],
      ],
      { stroke: 1.8 },
    ),
  lock: (n = 14) =>
    icon(
      n,
      [
        ["rect", { x: 5, y: 11, width: 14, height: 10, rx: 2 }],
        ["path", { d: "M8 11V7a4 4 0 0 1 8 0v4" }],
      ],
      { stroke: 2.5 },
    ),
  shield: (n = 18) =>
    icon(n, [
      ["rect", { x: 4, y: 10, width: 16, height: 11, rx: 2 }],
      ["path", { d: "M8 10V7a4 4 0 0 1 8 0v3" }],
    ]),
  warning: (n = 22) =>
    icon(n, [
      ["path", { d: "M12 9v4M12 17h.01" }],
      [
        "path",
        { d: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" },
      ],
    ]),
  arrowUp: (n = 14) => icon(n, [["path", { d: "M12 20V4M5 11l7-7 7 7" }]], { stroke: 3 }),
  arrowDown: (n = 14) => icon(n, [["path", { d: "M12 4v16M5 13l7 7 7-7" }]], { stroke: 3 }),
  check: (n = 14) => icon(n, [["path", { d: "M5 12l5 5 9-10" }]], { stroke: 3 }),
};
