import { DIAL, arcPath, centsToAngle, polar, tick, zonePath } from "../core/needle-geometry";
import { S } from "../strings";
import { s, setAttr, setClass } from "./dom";

export interface NeedleView {
  cents: number;
  state: "idle" | "in" | "out";
  stale: boolean;
  inTuneCents: number;
  label: string;
}

export function createNeedle() {
  const zone = s("path", { class: "zone", d: zonePath(5) });
  const hand = s("line", {
    class: "hand",
    x1: DIAL.cx,
    y1: DIAL.cy,
    x2: DIAL.cx,
    y2: DIAL.cy - DIAL.handLength,
    "stroke-width": 4,
    "stroke-linecap": "round",
    style: `transform-origin: ${DIAL.cx}px ${DIAL.cy}px`,
  });
  const labels = [-50, -25, 25, 50].map((c) => {
    const p = polar(DIAL.labelRadius, centsToAngle(c));
    return s(
      "text",
      { x: p.x.toFixed(1), y: (p.y + 4).toFixed(1), "text-anchor": "middle" },
      c > 0 ? `+${c}` : `−${-c}`,
    );
  });
  const svg = s(
    "svg",
    {
      class: "needle is-idle",
      viewBox: `0 0 ${DIAL.width} ${DIAL.height}`,
      role: "img",
      "aria-label": "",
    },
    s("path", {
      class: "track",
      d: arcPath(DIAL.arcRadius, -DIAL.maxAngle, DIAL.maxAngle),
      "stroke-width": 14,
      fill: "none",
      "stroke-linecap": "round",
    }),
    zone,
    ...[-50, -25, 25, 50].map((c) => s("line", { class: "tick", ...tick(c), "stroke-width": 2 })),
    ...labels,
    s("text", { class: "side side-flat", x: 20, y: 176 }, S.flatLabel),
    s("text", { class: "side side-sharp", x: 330, y: 176, "text-anchor": "end" }, S.sharpLabel),
    hand,
    s("circle", { class: "pivot", cx: DIAL.cx, cy: DIAL.cy, r: 9 }),
  );

  let lastWindow = 5;
  let lastAngle = Number.NaN;

  function update(v: NeedleView): void {
    if (v.inTuneCents !== lastWindow) {
      lastWindow = v.inTuneCents;
      setAttr(zone, "d", zonePath(v.inTuneCents));
    }
    const angle = v.state === "idle" ? 0 : Math.round(centsToAngle(v.cents) * 10) / 10;
    if (angle !== lastAngle) {
      lastAngle = angle;
      hand.style.transform = `rotate(${angle}deg)`;
    }
    setClass(svg, "is-idle", v.state === "idle");
    setClass(svg, "is-in", v.state === "in");
    setClass(svg, "is-out", v.state === "out");
    setClass(svg, "is-flat", v.state === "out" && v.cents < 0);
    setClass(svg, "is-sharp", v.state === "out" && v.cents > 0);
    setClass(svg, "is-stale", v.stale);
    setAttr(svg, "aria-label", v.label);
  }

  return { el: svg, update };
}
