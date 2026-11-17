"use client";

import { DRM_LISTS, type Lure } from "@/lib/memory/drm";

// The lure sits in the centre (dashed — it was never shown); the 15 words you actually
// saw orbit it, each wired to the centre. Lines draw in, then the words, then the lure
// "fills in" — the same gap your brain filled.

const W = 480;
const H = 400;
const CX = W / 2;
const CY = H / 2;

export default function AssociationMap({ lure, fooled }: { lure: Lure; fooled: boolean }) {
  const words = DRM_LISTS[lure];
  const nodes = words.map((w, i) => {
    const a = -Math.PI / 2 + (i / words.length) * Math.PI * 2;
    const k = i % 2 === 0 ? 1 : 0.74; // alternate rings so neighbours don't collide
    const x = CX + Math.cos(a) * 186 * k;
    const y = CY + Math.sin(a) * 158 * k;
    const c = Math.cos(a);
    const anchor: "start" | "end" | "middle" = c > 0.35 ? "start" : c < -0.35 ? "end" : "middle";
    // Line ends a little short of the word.
    const ex = CX + Math.cos(a) * (186 * k - 16);
    const ey = CY + Math.sin(a) * (158 * k - 14);
    const sx = CX + Math.cos(a) * 62;
    const sy = CY + Math.sin(a) * 46;
    return { w, x, y, anchor, sx, sy, ex, ey, i };
  });

  return (
    <svg
      className={`assoc ${fooled ? "assoc--fooled" : "assoc--held"}`}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Association map: “${lure}” in the centre, linked to the ${words.length} words you studied: ${words.join(", ")}.`}
    >
      <g className="assoc-lines">
        {nodes.map((n) => (
          <path
            key={n.w}
            className="assoc-line"
            d={`M${n.sx.toFixed(1)} ${n.sy.toFixed(1)}L${n.ex.toFixed(1)} ${n.ey.toFixed(1)}`}
            pathLength={1}
            style={{ "--d": `${n.i * 55}ms` } as React.CSSProperties}
          />
        ))}
      </g>
      <g className="assoc-words">
        {nodes.map((n) => (
          <text
            key={n.w}
            x={n.x}
            y={n.y}
            textAnchor={n.anchor}
            dominantBaseline="middle"
            className="assoc-word"
            style={{ "--d": `${250 + n.i * 55}ms` } as React.CSSProperties}
          >
            {n.w}
          </text>
        ))}
      </g>
      <g className="assoc-core">
        <ellipse cx={CX} cy={CY} rx="70" ry="52" className="assoc-halo" />
        <ellipse cx={CX} cy={CY} rx="58" ry="40" className="assoc-ring" />
        <text x={CX} y={CY - 3} textAnchor="middle" dominantBaseline="middle" className="assoc-lure">
          {lure}
        </text>
        <text x={CX} y={CY + 18} textAnchor="middle" dominantBaseline="middle" className="assoc-never">
          never shown
        </text>
      </g>
    </svg>
  );
}
