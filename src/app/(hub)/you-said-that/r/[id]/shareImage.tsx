import { ImageResponse } from "next/og";
import { makePair, shapes, H, W, type Features } from "@/lib/you-said-that/art";
import { shareHeadline, type Totals } from "@/lib/you-said-that/protocol";

export const size = { width: 1200, height: 630 };

// Two fixed pieces as decoration. Never the person's own pair, and nothing about the swap itself.
const DECOR = makePair("sharecrd", 0);

function PieceSvg({ f, w }: { f: Features; w: number }) {
  return (
    <svg width={w} height={(w * H) / W} viewBox={`0 0 ${W} ${H}`} style={{ display: "flex", borderRadius: 10 }}>
      {shapes(f).map((s, i) =>
        s.t === "rect" ? (
          <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} fill={s.fill} />
        ) : s.t === "circle" ? (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} stroke={s.stroke ?? "none"} strokeWidth={s.sw ?? 0} />
        ) : (
          <path key={i} d={s.d} fill={s.fill} stroke={s.stroke ?? "none"} strokeWidth={s.sw ?? 0} strokeLinecap={s.cap ?? "butt"} />
        )
      )}
    </svg>
  );
}

/** Result card for /you-said-that/r/:id, or (with no totals) the neutral challenge card for /you-said-that. */
export function renderResultImage(totals: Totals | null) {
  const headline = totals ? shareHeadline(totals) : "Which do you prefer? Tell us why.";
  const sub = totals ? "A five-minute test of choice and explanation." : "A quick taste test in two short parts.";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(160deg,#22170f,#0f0a06)", padding: 56, color: "#ecdfc6", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingRight: 40 }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: "#d4a656", textTransform: "uppercase" }}>You Said That?</div>
          <div style={{ display: "flex", fontSize: 58, fontWeight: 700, lineHeight: 1.1, marginTop: 28 }}>{headline}</div>
          <div style={{ display: "flex", fontSize: 30, lineHeight: 1.3, marginTop: 20, color: "#c8b896" }}>{sub}</div>
          <div style={{ display: "flex", marginTop: "auto", fontSize: 24, color: "#d4a656" }}>thelibrary.page/you-said-that</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <PieceSvg f={DECOR[0]} w={190} />
          <PieceSvg f={DECOR[1]} w={190} />
        </div>
      </div>
    ),
    size
  );
}
