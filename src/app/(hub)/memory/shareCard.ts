// Renders the shareable result card to a PNG with the Canvas API (no dependencies).
// Deliberately does NOT name the lure words — that would spoil the trick for whoever
// you send it to.

export interface ShareData {
  fooled: boolean[]; // per lure, in display order
  hitRate: number;
  url: string;
}

export async function renderShareCard(d: ShareData, serifFamily: string): Promise<Blob | null> {
  const W = 1200;
  const H = 630;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return null;
  try {
    await document.fonts?.ready;
  } catch {
    /* fonts API unavailable — fall back to whatever is loaded */
  }

  // Background: dark wood with a warm glow.
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#21160e");
  bg.addColorStop(1, "#110b07");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, -60, 40, W / 2, -60, 700);
  glow.addColorStop(0, "rgba(212,166,86,0.22)");
  glow.addColorStop(1, "rgba(212,166,86,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  // Gold double rule frame.
  g.strokeStyle = "rgba(212,166,86,0.55)";
  g.lineWidth = 2;
  g.strokeRect(36, 36, W - 72, H - 72);
  g.lineWidth = 1;
  g.strokeRect(46, 46, W - 92, H - 92);

  const serif = `${serifFamily}, Georgia, 'Times New Roman', serif`;
  const sans = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  const n = d.fooled.filter(Boolean).length;
  g.textAlign = "center";

  g.fillStyle = "#b08a48";
  g.font = `600 22px ${sans}`;
  spaced(g, "MEMORY THAT LIES", W / 2, 118, 6);

  g.fillStyle = "#f3e6c8";
  g.font = `600 76px ${serif}`;
  g.fillText(n === 0 ? "No false memories." : `I remembered ${n} of 5 words I never saw.`, W / 2, 228, W - 160);

  g.fillStyle = "#c9b896";
  g.font = `italic 40px ${serif}`;
  g.fillText(
    n === 0 ? "Five planted words, all turned down. Try it yourself." : "They were planted, never shown. Try it yourself.",
    W / 2,
    292,
    W - 180
  );

  // Five tokens: filled = fooled.
  const r = 26;
  const gap = 34;
  const total = 5 * r * 2 + 4 * gap;
  let x = W / 2 - total / 2 + r;
  for (const f of d.fooled) {
    g.beginPath();
    g.arc(x, 392, r, 0, Math.PI * 2);
    if (f) {
      g.fillStyle = "#a8392c";
      g.fill();
      g.strokeStyle = "#e07a5f";
    } else {
      g.strokeStyle = "rgba(236,223,198,0.45)";
    }
    g.lineWidth = 2;
    g.stroke();
    x += r * 2 + gap;
  }
  g.fillStyle = "#8a7a60";
  g.font = `20px ${sans}`;
  g.fillText(`●  fooled      ○  not fooled      ·      remembered ${Math.round(d.hitRate * 100)}% of the real words`, W / 2, 462);

  g.fillStyle = "#d4a656";
  g.font = `600 30px ${sans}`;
  g.fillText(d.url.replace(/^https?:\/\//, ""), W / 2, 548);

  return new Promise((res) => c.toBlob((b) => res(b), "image/png"));
}

function spaced(g: CanvasRenderingContext2D, text: string, cx: number, y: number, tracking: number) {
  const chars = [...text];
  const widths = chars.map((ch) => g.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  let x = cx - total / 2;
  const prev = g.textAlign;
  g.textAlign = "left";
  chars.forEach((ch, i) => {
    g.fillText(ch, x, y);
    x += widths[i] + tracking;
  });
  g.textAlign = prev;
}
