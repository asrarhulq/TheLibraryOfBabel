import { useId } from "react";
import { describe, H, pieceId, shapes, W, type Features } from "@/lib/you-said-that/art";

/** One generated piece as crisp SVG, with alt text that names its forms and places. */
export default function Piece({ f, label = true }: { f: Features; label?: boolean }) {
  return (
    <svg
      className="yst-piece"
      viewBox={`0 0 ${W} ${H}`}
      role={label ? "img" : undefined}
      aria-label={label ? describe(f) : undefined}
      aria-hidden={label ? undefined : true}
      data-piece-id={pieceId(f)}
      preserveAspectRatio="xMidYMid meet"
    >
      {shapes(f).map((s, i) =>
        s.t === "rect" ? (
          <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} fill={s.fill} rx={s.rx} />
        ) : s.t === "circle" ? (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} stroke={s.stroke} strokeWidth={s.sw} />
        ) : (
          <path key={i} d={s.d} fill={s.fill} stroke={s.stroke} strokeWidth={s.sw} strokeLinecap={s.cap} />
        )
      )}
    </svg>
  );
}

/** The back of a card: the same for every piece. */
export function CardBack() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg className="yst-piece" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <pattern id={`yb${id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="#2a1d14" />
          <path d="M0 0v8" stroke="#d4a656" strokeWidth="1" opacity=".35" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#yb${id})`} />
      <rect x="7" y="7" width={W - 14} height={H - 14} fill="none" stroke="#d4a656" strokeWidth="1" opacity=".6" />
      <circle cx={W / 2} cy={H / 2} r="13" fill="#2a1d14" stroke="#d4a656" strokeWidth="1.2" />
      <text x={W / 2} y={H / 2 + 5} textAnchor="middle" fontSize="14" fontFamily="Georgia, serif" fill="#d4a656">
        ?
      </text>
    </svg>
  );
}
