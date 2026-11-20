import { ImageResponse } from "next/og";

// Share preview for /choice-machine: the machine's eye and the challenge. Nothing about any result.
export const alt = "The Choice Machine: can a machine predict your free choice?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TICKS = Array.from({ length: 60 }, (_, i) => i);
const STRI = Array.from({ length: 48 }, (_, i) => i);

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 70px",
          gap: 60,
          color: "#ecdfc6",
          fontFamily: "serif",
          background: "radial-gradient(circle at 75% 45%, #2a1d12 0%, #120c07 55%, #080503 100%)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 8, color: "#c9a35f", textTransform: "uppercase", fontFamily: "monospace" }}>
            Prediction and free will
          </div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.02, marginTop: 22, color: "#f3dca2" }}>The Choice Machine</div>
          <div style={{ display: "flex", fontSize: 34, lineHeight: 1.3, marginTop: 24, color: "#c8b896" }}>
            Eleven choices, left or right. Before the last one, it seals its prediction. Can you beat it?
          </div>
          <div style={{ display: "flex", marginTop: 40, fontSize: 24, color: "#c9a35f", fontFamily: "monospace" }}>thelibrary.page/choice-machine</div>
        </div>
        <svg width="380" height="380" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="97" fill="#0b0806" stroke="#c9a35f" strokeWidth="3" />
          {TICKS.map((i) => {
            const a = (i / 60) * Math.PI * 2;
            const r1 = i % 5 === 0 ? 84 : 88;
            return (
              <line key={i} x1={100 + Math.cos(a) * r1} y1={100 + Math.sin(a) * r1} x2={100 + Math.cos(a) * 93} y2={100 + Math.sin(a) * 93} stroke="#c9a35f" strokeOpacity={i % 5 === 0 ? 0.9 : 0.45} strokeWidth={i % 5 === 0 ? 1.4 : 0.8} />
            );
          })}
          <circle cx="100" cy="100" r="72" fill="none" stroke="#c9a35f" strokeOpacity=".4" strokeDasharray="1 3" />
          <circle cx="100" cy="100" r="58" fill="#c46a14" />
          <circle cx="100" cy="100" r="40" fill="#e08a2a" />
          <circle cx="100" cy="100" r="28" fill="#f2b452" />
          {STRI.map((i) => {
            const a = (i / 48) * Math.PI * 2;
            return <line key={i} x1={100 + Math.cos(a) * 22} y1={100 + Math.sin(a) * 22} x2={100 + Math.cos(a) * 57} y2={100 + Math.sin(a) * 57} stroke={i % 2 ? "#3a1806" : "#ffe0a0"} strokeOpacity={i % 2 ? 0.55 : 0.3} strokeWidth="1" />;
          })}
          <circle cx="100" cy="100" r="58" fill="none" stroke="#000" strokeOpacity=".5" strokeWidth="5" />
          <circle cx="100" cy="100" r="20" fill="#070402" />
          <ellipse cx="80" cy="74" rx="18" ry="9" fill="#fff" opacity=".14" />
        </svg>
      </div>
    ),
    size
  );
}
