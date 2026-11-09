/** Drawings for the beginner setup (artboards 9–13). Geometry is copied from the canvas. */
import { s } from "./dom";

const TEXT = { "font-family": "inherit", "font-weight": 800 };

/** Ukulele as the player sees it: head left, string 4 on top. Mirrored for left-handers. */
export function holdDrawing(label: string, headText: string, strumText: string, mirrored: boolean) {
  const strings = [70, 82, 94, 106];
  const widths = [2.5, 2.5, 2, 1.6];
  const body = s(
    "g",
    mirrored ? { transform: "translate(338 0) scale(-1 1)" } : {},
    s("path", {
      d: "M8 62 L58 70 L58 106 L8 114 Z",
      fill: "var(--wood-3)",
      stroke: "var(--wood-edge)",
      "stroke-width": 2,
      "stroke-linejoin": "round",
    }),
    ...[
      [22, 58],
      [42, 61],
      [22, 118],
      [42, 115],
    ].map(([cx, cy]) => s("circle", { cx, cy, r: 6, fill: "var(--muted)" })),
    s("ellipse", {
      cx: 214,
      cy: 88,
      rx: 46,
      ry: 58,
      fill: "var(--wood-1)",
      stroke: "var(--wood-edge)",
      "stroke-width": 2,
    }),
    s("ellipse", {
      cx: 280,
      cy: 88,
      rx: 52,
      ry: 70,
      fill: "var(--wood-1)",
      stroke: "var(--wood-edge)",
      "stroke-width": 2,
    }),
    s("rect", { x: 58, y: 64, width: 160, height: 48, fill: "var(--wood-2)" }),
    s("line", { x1: 62, y1: 64, x2: 62, y2: 112, stroke: "var(--string)", "stroke-width": 3 }),
    ...[84, 105, 125, 143, 160].map((x) =>
      s("line", { x1: x, y1: 64, x2: x, y2: 112, stroke: "var(--muted)", "stroke-width": 1.5 }),
    ),
    s("circle", { cx: 250, cy: 88, r: 24, fill: "var(--hole)" }),
    s("rect", { x: 306, y: 68, width: 10, height: 40, rx: 2, fill: "var(--wood-3)" }),
    ...strings.map((y, i) =>
      s("line", {
        x1: 62,
        y1: y,
        x2: 311,
        y2: y,
        stroke: i === 0 ? "var(--accent)" : "var(--string)",
        "stroke-width": widths[i] ?? 2,
      }),
    ),
  );
  const badgeX = mirrored ? 338 - 182 : 182;
  const badges = strings.map((y, i) =>
    s(
      "g",
      {},
      s("circle", {
        cx: badgeX,
        cy: y,
        r: 6,
        fill: i === 0 ? "var(--accent)" : "var(--text)",
      }),
      s(
        "text",
        {
          x: badgeX,
          y: y + 3.2,
          "text-anchor": "middle",
          fill: "var(--bg)",
          "font-size": 9,
          ...TEXT,
        },
        String(4 - i),
      ),
    ),
  );
  const headX = mirrored ? 330 : 8;
  return s(
    "svg",
    { width: 338, height: 176, viewBox: "0 0 338 176", role: "img", "aria-label": label },
    body,
    ...badges,
    s(
      "text",
      {
        x: headX,
        y: 146,
        "text-anchor": mirrored ? "end" : "start",
        fill: "var(--muted)",
        "font-size": 12,
        "font-weight": 600,
      },
      headText,
    ),
    s(
      "text",
      {
        x: mirrored ? 88 : 250,
        y: 170,
        "text-anchor": "middle",
        fill: "var(--muted)",
        "font-size": 12,
        "font-weight": 600,
      },
      strumText,
    ),
  );
}

/** Small ukulele silhouette, scaled by overall length (baritone = 1). */
export function sizeSilhouette(scale: number) {
  const w = 120 * scale;
  return s(
    "svg",
    { width: 124, height: 44, viewBox: "0 0 124 44", "aria-hidden": "true", class: "silhouette" },
    s(
      "g",
      {
        transform: `translate(${((124 - w) / 2).toFixed(1)} ${((44 - 42 * scale) / 2).toFixed(1)}) scale(${scale})`,
        fill: "currentColor",
      },
      s("rect", { x: 0, y: 16, width: 14, height: 10, rx: 2 }),
      s("rect", { x: 12, y: 18, width: 52, height: 6 }),
      s("circle", { cx: 74, cy: 21, r: 14 }),
      s("circle", { cx: 100, cy: 21, r: 19 }),
    ),
  );
}

/** Strings 4 and 3 crossing the sound hole; string 4 thin, or thick and wound. */
export function stringPair(kind: "thin" | "thick") {
  const four =
    kind === "thin"
      ? [
          s("line", {
            x1: 40,
            y1: 22,
            x2: 326,
            y2: 22,
            stroke: "var(--accent)",
            "stroke-width": 1.8,
          }),
        ]
      : [
          s("line", {
            x1: 40,
            y1: 22,
            x2: 326,
            y2: 22,
            stroke: "var(--wound)",
            "stroke-width": 5.5,
          }),
          s("line", {
            x1: 40,
            y1: 22,
            x2: 326,
            y2: 22,
            stroke: "var(--string)",
            "stroke-width": 5.5,
            "stroke-dasharray": "1.2 1.8",
          }),
        ];
  return s(
    "svg",
    {
      viewBox: "0 0 326 64",
      "aria-hidden": "true",
      class: "string-pair",
      preserveAspectRatio: "xMinYMid slice",
    },
    s("circle", { cx: 250, cy: 32, r: 40, fill: "var(--hole)" }),
    ...four,
    s("line", { x1: 40, y1: 42, x2: 326, y2: 42, stroke: "var(--string)", "stroke-width": 3.4 }),
    s(
      "text",
      {
        x: 14,
        y: 26,
        fill: kind === "thin" ? "var(--accent)" : "var(--text-2)",
        "font-size": 12,
        ...TEXT,
      },
      "4",
    ),
    s("text", { x: 14, y: 46, fill: "var(--muted)", "font-size": 12, ...TEXT }, "3"),
  );
}

/** Four strings with one highlighted (listen step). */
export function stringsStrip(active: number | null, done: readonly number[], label: string) {
  const ys = [17, 29, 41, 53];
  const widths = [2, 3.6, 2.6, 2];
  const colour = (n: number) =>
    n === active ? "var(--accent)" : done.includes(n) ? "var(--ok)" : "var(--faint)";
  return s(
    "svg",
    { viewBox: "0 0 350 70", role: "img", "aria-label": label, class: "strings-strip" },
    s("circle", { cx: 270, cy: 35, r: 44, fill: "var(--hole)" }),
    ...ys.flatMap((y, i) => {
      const n = 4 - i;
      return [
        s("line", {
          x1: 34,
          y1: y,
          x2: 350,
          y2: y,
          stroke: colour(n),
          "stroke-width": widths[i] ?? 2,
        }),
        s(
          "text",
          {
            x: 14,
            y: y + 4,
            fill: n === active || done.includes(n) ? colour(n) : "var(--muted)",
            "font-size": 11,
            ...TEXT,
          },
          String(n),
        ),
      ];
    }),
  );
}

/** Short horizontal line whose thickness suggests the string gauge. */
export function gaugeLine(width: number) {
  return s(
    "svg",
    { width: 48, height: 8, viewBox: "0 0 48 8", "aria-hidden": "true" },
    s("line", { x1: 0, y1: 4, x2: 48, y2: 4, stroke: "var(--string)", "stroke-width": width }),
  );
}
