// Canvas drawing for the arena. Abstract shapes only: circles and a five-point star.
import { RADIUS, STAR_R } from "@/lib/missed/engine";

export type StarLook = "star" | "white" | "dark";

export interface DrawState {
  bodies: { x: number; y: number; white: boolean }[];
  star: { x: number; y: number; rot: number; look?: StarLook } | null;
  spotlight?: boolean;
  highlightStar?: number; // 0..1 glow strength
  labels?: boolean;
  dim?: number; // 0..1 darken everything except the star
}

const ARENA = "#2b2723";
const WHITE = "#f6f1e7";
const DARK = "#0c0a08";
const MAGENTA = "#ff2bd6";

let spotCanvas: HTMLCanvasElement | null = null;

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, rot: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? R : R * 0.45;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawFrame(ctx: CanvasRenderingContext2D, W: number, s: DrawState) {
  const px = (v: number) => v * W;
  ctx.clearRect(0, 0, W, W);
  ctx.fillStyle = ARENA;
  ctx.fillRect(0, 0, W, W);

  const r = px(RADIUS);
  for (const b of s.bodies) {
    ctx.beginPath();
    ctx.arc(px(b.x), px(b.y), r, 0, Math.PI * 2);
    if (b.white) {
      ctx.fillStyle = WHITE;
      ctx.fill();
    } else {
      ctx.fillStyle = DARK;
      ctx.fill();
      ctx.lineWidth = Math.max(1, W / 360);
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.stroke();
    }
  }

  const drawStar = () => {
    if (!s.star) return;
    const { x, y, rot, look = "star" } = s.star;
    if (look === "star") {
      starPath(ctx, px(x), px(y), px(STAR_R), rot);
      ctx.fillStyle = MAGENTA;
      ctx.fill();
      ctx.lineWidth = Math.max(1.2, W / 300);
      ctx.strokeStyle = "rgba(255,240,252,0.85)";
      ctx.stroke();
    } else {
      // Most et al. (2001) varied only the brightness of a cross: white (like the counted shapes)
      // or black (like the ignored ones). Same here.
      const R = px(STAR_R * 0.85),
        t = R * 0.36;
      ctx.save();
      ctx.translate(px(x), px(y));
      ctx.rotate(rot * 0.3);
      ctx.beginPath();
      ctx.rect(-R, -t / 2, 2 * R, t);
      ctx.rect(-t / 2, -R, t, 2 * R);
      ctx.fillStyle = look === "white" ? WHITE : DARK;
      ctx.fill();
      if (look === "dark") {
        ctx.lineWidth = Math.max(1, W / 360);
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  if (s.spotlight) {
    // Darken the arena except soft pools of light on the shapes being counted.
    spotCanvas ??= document.createElement("canvas");
    if (spotCanvas.width !== ctx.canvas.width) {
      spotCanvas.width = ctx.canvas.width;
      spotCanvas.height = ctx.canvas.height;
    }
    const o = spotCanvas.getContext("2d")!;
    o.setTransform(ctx.getTransform());
    o.globalCompositeOperation = "source-over";
    o.clearRect(0, 0, W, W);
    o.fillStyle = "rgba(6,5,4,0.86)";
    o.fillRect(0, 0, W, W);
    o.globalCompositeOperation = "destination-out";
    for (const b of s.bodies) {
      if (!b.white) continue;
      const g = o.createRadialGradient(px(b.x), px(b.y), 0, px(b.x), px(b.y), px(0.13));
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.55, "rgba(0,0,0,0.85)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      o.fillStyle = g;
      o.beginPath();
      o.arc(px(b.x), px(b.y), px(0.13), 0, Math.PI * 2);
      o.fill();
    }
    drawStar(); // star sits under the darkness, in the unlit periphery
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(spotCanvas, 0, 0);
    ctx.restore();
  } else drawStar();

  if (s.dim && s.dim > 0) {
    ctx.fillStyle = `rgba(0,0,0,${0.65 * s.dim})`;
    ctx.fillRect(0, 0, W, W);
    drawStar(); // the star stays bright above the dimming
  }

  if (s.star && s.highlightStar && s.highlightStar > 0) {
    const cx = px(s.star.x),
      cy = px(s.star.y),
      R = px(STAR_R);
    const k = s.highlightStar;
    const g = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 2.4);
    g.addColorStop(0, `rgba(255,214,140,${0.5 * k})`);
    g.addColorStop(1, "rgba(255,214,140,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 2.4, 0, Math.PI * 2);
    ctx.fill();
    drawStar();
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.45, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,226,160,${0.95 * k})`;
    ctx.lineWidth = Math.max(2, W / 200);
    ctx.stroke();
    // arrow from above
    const ay = Math.max(R * 2.2, cy - R * 3.4);
    ctx.beginPath();
    ctx.moveTo(cx, ay - R * 0.9);
    ctx.lineTo(cx, cy - R * 1.65);
    ctx.moveTo(cx - R * 0.35, cy - R * 2.0);
    ctx.lineTo(cx, cy - R * 1.65);
    ctx.lineTo(cx + R * 0.35, cy - R * 2.0);
    ctx.stroke();
  }

  if (s.labels) {
    ctx.font = `600 ${Math.max(10, W / 44)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const tag = (x: number, y: number, text: string, color: string) => {
      const tx = px(x),
        ty = px(y) - r * 1.35;
      const w = ctx.measureText(text).width + 10;
      const h = Math.max(14, W / 34);
      ctx.fillStyle = "rgba(10,8,6,0.82)";
      ctx.fillRect(tx - w / 2, ty - h, w, h);
      ctx.fillStyle = color;
      ctx.fillText(text, tx, ty - 2);
    };
    for (const b of s.bodies) tag(b.x, b.y, b.white ? "white · counted" : "dark · ignored", b.white ? WHITE : "#b9ada0");
    if (s.star) tag(s.star.x, s.star.y - STAR_R + RADIUS, "unexpected", "#ff8fe8");
  }
}
