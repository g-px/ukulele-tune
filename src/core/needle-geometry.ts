/** Geometry of the cents dial (docs/planning/ui-spec.md, "Needle geometry"). */

export const DIAL = {
  width: 350,
  height: 200,
  cx: 175,
  cy: 190,
  arcRadius: 160,
  maxAngle: 45,
  rangeCents: 50,
  zoneInner: 140,
  zoneOuter: 170,
  tickInner: 141,
  tickOuter: 160,
  labelRadius: 180,
  handLength: 150,
} as const;

/** Degrees from vertical (clockwise positive) for a cents offset, clamped to the dial. */
export function centsToAngle(cents: number): number {
  if (!Number.isFinite(cents)) return 0;
  const c = Math.max(-DIAL.rangeCents, Math.min(DIAL.rangeCents, cents));
  return (c / DIAL.rangeCents) * DIAL.maxAngle;
}

export function polar(radius: number, angleDeg: number): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180;
  return { x: DIAL.cx + radius * Math.sin(a), y: DIAL.cy - radius * Math.cos(a) };
}

const f = (n: number) => Number(n.toFixed(2));

export function arcPath(radius: number, fromDeg: number, toDeg: number): string {
  const a = polar(radius, fromDeg);
  const b = polar(radius, toDeg);
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return `M ${f(a.x)} ${f(a.y)} A ${radius} ${radius} 0 ${large} 1 ${f(b.x)} ${f(b.y)}`;
}

/** Ring segment showing the in-tune window of ±inTuneCents. */
export function zonePath(inTuneCents: number): string {
  const w = centsToAngle(inTuneCents);
  const o1 = polar(DIAL.zoneOuter, -w);
  const o2 = polar(DIAL.zoneOuter, w);
  const i2 = polar(DIAL.zoneInner, w);
  const i1 = polar(DIAL.zoneInner, -w);
  return [
    `M ${f(o1.x)} ${f(o1.y)}`,
    `A ${DIAL.zoneOuter} ${DIAL.zoneOuter} 0 0 1 ${f(o2.x)} ${f(o2.y)}`,
    `L ${f(i2.x)} ${f(i2.y)}`,
    `A ${DIAL.zoneInner} ${DIAL.zoneInner} 0 0 0 ${f(i1.x)} ${f(i1.y)}`,
    "Z",
  ].join(" ");
}

export function tick(cents: number): { x1: number; y1: number; x2: number; y2: number } {
  const angle = centsToAngle(cents);
  const a = polar(DIAL.tickOuter, angle);
  const b = polar(DIAL.tickInner, angle);
  return { x1: f(a.x), y1: f(a.y), x2: f(b.x), y2: f(b.y) };
}
