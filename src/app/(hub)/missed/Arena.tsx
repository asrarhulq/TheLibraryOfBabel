"use client";

import { useEffect, useRef } from "react";
import { FPS, starAt, type Scene } from "@/lib/missed/engine";
import { drawFrame } from "./render";

export type Program =
  | { type: "play"; spotlight?: boolean; hideStar?: boolean }
  | { type: "rewind" } // from the end back to the star's mid-crossing at 2×, then highlight it
  | { type: "still"; t: number; highlight?: boolean };

/** Renders a precomputed scene on a crisp, square canvas. */
export default function Arena({
  scene,
  program,
  onEnd,
  label,
  onTime,
}: {
  scene: Scene;
  program: Program;
  onEnd?: () => void;
  onTime?: (t: number) => void;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cb = useRef({ onEnd, onTime });
  useEffect(() => {
    cb.current = { onEnd, onTime };
  });

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let W = 0;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const css = canvas.getBoundingClientRect().width;
      canvas.width = Math.round(css * dpr);
      canvas.height = Math.round(css * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = css;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    const duration = scene.frames / FPS;
    const starMid = scene.star ? scene.star.enter + scene.star.cross / 2 : duration / 2;
    const bodiesAt = (t: number) => {
      const f = Math.max(0, Math.min(scene.frames - 1, Math.floor(t * FPS)));
      const out = [];
      for (let i = 0; i < scene.n; i++) {
        out.push({ x: scene.positions[(f * scene.n + i) * 2], y: scene.positions[(f * scene.n + i) * 2 + 1], white: scene.white[i] });
      }
      return out;
    };
    const starState = (t: number, hide?: boolean) => {
      if (!scene.star || hide) return null;
      return starAt(scene.star, t);
    };

    let raf = 0;
    let last = 0;
    let t = program.type === "rewind" ? duration : program.type === "still" ? program.t : 0;
    let glow = 0;
    let ended = false;

    const loop = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; // clamp: a hidden tab pauses
      last = now;
      if (program.type === "play") {
        t += dt;
        if (t >= duration && !ended) {
          ended = true;
          t = duration - 1 / FPS;
          drawFrame(ctx, W, { bodies: bodiesAt(t), star: starState(t, program.hideStar), spotlight: program.spotlight });
          cb.current.onEnd?.();
          return;
        }
        drawFrame(ctx, W, { bodies: bodiesAt(t), star: starState(t, program.hideStar), spotlight: program.spotlight });
      } else if (program.type === "rewind") {
        if (t > starMid) {
          t = Math.max(starMid, t - dt * 2);
          drawFrame(ctx, W, { bodies: bodiesAt(t), star: starState(t), dim: 0.6 });
        } else {
          glow = Math.min(1, glow + dt * 1.6);
          drawFrame(ctx, W, { bodies: bodiesAt(t), star: starState(t), dim: 0.6 + 0.4 * glow, highlightStar: glow });
          if (glow >= 1 && !ended) {
            ended = true;
            cb.current.onEnd?.();
          }
        }
      } else {
        drawFrame(ctx, W, { bodies: bodiesAt(t), star: starState(t), highlightStar: program.highlight ? 1 : 0, dim: program.highlight ? 1 : 0 });
        return;
      }
      cb.current.onTime?.(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [scene, program]);

  return <canvas ref={ref} className="ms-arena" role="img" aria-label={label} />;
}
