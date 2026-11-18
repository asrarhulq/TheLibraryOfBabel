"use client";

import { useEffect, useState } from "react";

export type Seg = "noticed" | "defended" | "passed";

const LABEL: Record<Seg, string> = { noticed: "Noticed", defended: "Defended", passed: "Passed unflagged" };
const MARK: Record<Seg, string> = { noticed: "✓", defended: "✎", passed: "·" };

const CX = 90;
const R = 70;
const pt = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [CX + Math.cos(a) * R, CX + Math.sin(a) * R];
};
function arc(a0: number, a1: number) {
  const [x0, y0] = pt(a0);
  const [x1, y1] = pt(a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/**
 * One arc per swap, drawn in turn. Kinds differ by mark and stroke width as well as colour:
 * noticed ✓ (thick), defended ✎ (thick), passed · (thin).
 */
export default function Ring({ segs, reduced }: { segs: Seg[]; reduced: boolean }) {
  const [shown, setShown] = useState(reduced ? segs.length : 0);
  useEffect(() => {
    if (reduced) return;
    const ts = segs.map((_, i) => window.setTimeout(() => setShown(i + 1), 250 + i * 260));
    return () => ts.forEach(clearTimeout);
  }, [segs, reduced]);

  const n = segs.length || 1;
  const step = 360 / n;
  const gap = 5; // degrees
  return (
    <figure className="yst-ring">
      <svg viewBox="0 0 180 180" role="img" aria-label={segs.map((s, i) => `Swap ${i + 1}: ${LABEL[s]}`).join(". ")}>
        <circle cx={CX} cy={CX} r={R} fill="none" className="yst-ring-track" strokeWidth="14" />
        {segs.map((s, i) => {
          const a0 = -90 + step * i + gap / 2;
          return (
            <path
              key={i}
              d={arc(a0, a0 + step - gap)}
              fill="none"
              pathLength={1}
              className={`yst-ring-seg yst-ring-seg--${s}`}
              strokeDasharray="1 1"
              strokeDashoffset={i < shown ? 0 : 1}
            />
          );
        })}
        {segs.map((s, i) => {
          const [x, y] = pt(-90 + step * (i + 0.5));
          return (
            <text key={`m${i}`} x={x} y={y + 4} textAnchor="middle" className={`yst-ring-mark yst-ring-mark--${s}`} opacity={i < shown ? 1 : 0}>
              {MARK[s]}
            </text>
          );
        })}
      </svg>
      <figcaption className="yst-ring-legend">
        {(["noticed", "defended", "passed"] as Seg[])
          .filter((k) => segs.includes(k))
          .map((k) => (
            <span key={k}>
              <i className={`yst-key yst-key--${k}`} aria-hidden="true">
                {MARK[k]}
              </i>
              {LABEL[k]}: {segs.filter((s) => s === k).length}
            </span>
          ))}
      </figcaption>
    </figure>
  );
}
