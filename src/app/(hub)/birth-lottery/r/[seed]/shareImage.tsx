import { ImageResponse } from "next/og";
import { computeRoll } from "@/lib/birth-lottery/roll";

// Server-rendered share image for a roll: used as the Open Graph image and for the
// stable /birth-lottery/r/:seed/card URL behind the preview and "Download image" button.
export const size = { width: 1200, height: 630 };

export function renderShareImage(seed: string) {
  const r = computeRoll(seed);
  const gold = "#d4a656";
  const parchment = "#ecdfc6";
  const dim = "#a8987a";

  if (!r) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#120c08", color: parchment, fontSize: 64 }}>
          The Birth Lottery
        </div>
      ),
      size
    );
  }

  const died5 = Math.round(100 - (r.stats.survive5.value ?? 0));
  const outcome =
    r.outcomeAge === null ? "Still alive at 80" : r.outcomeAge === 0 ? "Did not reach age 1" : `Lived to ${r.outcomeAge}`;
  // 100 dots: filled = didn't reach 5
  const dots = Array.from({ length: 100 }, (_, i) => i < died5);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(160deg, #22170f 0%, #0f0a06 100%)",
          color: parchment,
          padding: 56,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, border: `2px solid ${gold}`, borderRadius: 18, padding: "40px 48px" }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: gold, textTransform: "uppercase" }}>The Birth Lottery</div>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 700, marginTop: 18, lineHeight: 1 }}>{r.yearLabel}</div>
          <div style={{ display: "flex", fontSize: 38, marginTop: 14, color: parchment }}>{r.region.name}</div>
          <div style={{ display: "flex", marginTop: 34, gap: 48, alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: "#f08d6f" }}>{died5}%</div>
              <div style={{ display: "flex", fontSize: 22, color: dim }}>didn&apos;t see age 5</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 64, fontWeight: 700 }}>{Math.round(r.stats.e15.value ?? 0)}</div>
              <div style={{ display: "flex", fontSize: 22, color: dim }}>expected age if you reached 15</div>
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 30, fontSize: 32, color: gold }}>{outcome}</div>
          <div style={{ display: "flex", fontSize: 18, color: dim, marginTop: "auto" }}>
            thelibrary.page/birth-lottery · {r.confidence} confidence · historical estimates
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", width: 330, marginLeft: 40, alignContent: "center", gap: 9 }}>
          {dots.map((d, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: 24,
                height: 24,
                borderRadius: 12,
                background: d ? "rgba(236,223,198,0.12)" : "#d4a656",
                border: i === r.youIndex ? "3px solid #fff4dc" : "none",
              }}
            />
          ))}
        </div>
      </div>
    ),
    size
  );
}
