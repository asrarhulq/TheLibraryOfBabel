import { ImageResponse } from "next/og";
import type { MissedRunDoc } from "@/lib/db/missedRuns";

export const size = { width: 1200, height: 630 };

const ARENA = "#2b2723";
const MAGENTA = "#ff2bd6";

/** Five-point star polygon points for an SVG of size s. */
function starPoints(cx: number, cy: number, R: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? R : R * 0.45;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(" ");
}

const DOTS: [number, number, boolean][] = [
  [60, 70, true],
  [250, 95, true],
  [95, 270, true],
  [290, 300, true],
  [160, 50, false],
  [55, 175, false],
  [280, 200, false],
  [180, 320, false],
];

/** Result card. Shows the star only for result links; the challenge image never does. */
export function renderResultImage(run: MissedRunDoc | null, seconds: number, opts: { challenge?: boolean } = {}) {
  const showStar = !!run && !opts.challenge;
  const headline = !run || opts.challenge ? "Watch closely. Count carefully." : run.identified ? `I counted ${run.countAnswer} bounces and spotted the surprise.` : `I counted ${run.countAnswer} bounces.`;
  const sub =
    !run || opts.challenge
      ? "A 90-second attention test. Notice anything?"
      : run.identified
        ? "Can you?"
        : `I missed the magenta star that crossed the screen for ${seconds} seconds.`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(160deg,#22170f,#0f0a06)", padding: 56, color: "#ecdfc6", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingRight: 40 }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: "#d4a656", textTransform: "uppercase" }}>The Thing You Missed</div>
          <div style={{ display: "flex", fontSize: 58, fontWeight: 700, lineHeight: 1.1, marginTop: 28 }}>{headline}</div>
          <div style={{ display: "flex", fontSize: 32, lineHeight: 1.3, marginTop: 20, color: showStar && !run!.identified ? "#ff8fe8" : "#c8b896" }}>{sub}</div>
          <div style={{ display: "flex", marginTop: "auto", fontSize: 24, color: "#d4a656" }}>thelibrary.page/missed</div>
        </div>
        <svg width="380" height="380" viewBox="0 0 380 380" style={{ display: "flex", alignSelf: "center" }}>
          <rect width="380" height="380" rx="10" fill={ARENA} />
          {DOTS.map(([x, y, w], i) => (
            <circle key={i} cx={x} cy={y} r="13" fill={w ? "#f6f1e7" : "#0c0a08"} stroke={w ? "none" : "rgba(255,255,255,0.25)"} strokeWidth="2" />
          ))}
          {showStar && <polygon points={starPoints(190, 190, 40)} fill={MAGENTA} stroke="#fff0fc" strokeWidth="2.5" />}
        </svg>
      </div>
    ),
    size
  );
}
