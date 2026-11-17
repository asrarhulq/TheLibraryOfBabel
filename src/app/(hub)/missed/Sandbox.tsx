"use client";

import { useEffect, useRef, useState } from "react";
import { DT, Sim, rngFrom, SANDBOX, STAR_R, type Difficulty } from "@/lib/missed/engine";
import { MOST2001, SC1999 } from "@/lib/missed/research";
import { drawFrame, type StarLook } from "./render";

const LOOP = 10; // seconds between surprises
const CROSS = 6;

// What published studies found (no invented numbers): Easy/Hard from Simons & Chabris (1999);
// look-alike from Most et al. (2001), Exp. 1 (attending white) and Exp. 3 (unique red cross).
const DIFF_READOUT: Record<Difficulty, { missed: number | null; text: string }> = {
  easy: { missed: 100 - SC1999.easyNoticedPct, text: `Easy counting task: ${100 - SC1999.easyNoticedPct}% missed the surprise.` },
  medium: { missed: null, text: "Somewhere in between — no study measured this exact level." },
  hard: { missed: 100 - SC1999.hardNoticedPct, text: `Hard counting task: ${100 - SC1999.hardNoticedPct}% missed the surprise.` },
};
const LOOK_READOUT: Record<StarLook, { missed: number; text: string }> = {
  white: { missed: 100 - MOST2001.attendWhite.white, text: `White, like the counted shapes: only ${100 - MOST2001.attendWhite.white}% missed it.` },
  star: { missed: 100 - MOST2001.uniqueCrossNoticedPct, text: `Unique colour and shape: ${100 - MOST2001.uniqueCrossNoticedPct}% still missed it.` },
  dark: { missed: 100 - MOST2001.attendWhite.black, text: `Dark, like the ignored shapes: ${100 - MOST2001.attendWhite.black}% missed it.` },
};

function Gauge({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="ms-gauge" role="img" aria-label={`${label}: ${value == null ? "between the measured levels" : `${value}% missed`}`}>
      <div className="ms-gauge-track">
        <span className="ms-gauge-fill" style={{ "--w": (value ?? 45) / 100 } as React.CSSProperties} data-unknown={value == null} />
      </div>
      <div className="ms-gauge-scale" aria-hidden="true">
        <span>fewer miss it</span>
        <span>more miss it</span>
      </div>
    </div>
  );
}

export default function Sandbox() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [diff, setDiff] = useState<Difficulty>("medium");
  const [look, setLook] = useState<StarLook>("star");
  const [frozen, setFrozen] = useState(false);
  const live = useRef({ look, frozen });
  useEffect(() => {
    live.current = { look, frozen };
  });

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = SANDBOX[diff];
    const sim = new Sim(rngFrom(`sandbox|${diff}|${Date.now()}`), c.whites, c.darks, c.speed * (reduce ? 0.6 : 1), c.wander);
    let W = 0;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.getBoundingClientRect().width;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(W * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    let t = 2;
    let acc = 0;
    let last = 0;
    let raf = 0;
    const loop = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (!live.current.frozen) {
        t += dt;
        acc += dt;
        while (acc >= DT) {
          sim.step();
          acc -= DT;
        }
      }
      const k = ((t % LOOP) - 2) / CROSS;
      const star = k >= 0 && k <= 1 ? { x: -STAR_R + (1 + 2 * STAR_R) * k, y: 0.5, rot: k * 2.2, look: live.current.look } : null;
      drawFrame(ctx, W, { bodies: sim.bodies, star, labels: live.current.frozen });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [diff]);

  return (
    <section className="ms-sec ms-sandbox" aria-labelledby="ms-sandbox-title">
      <h2 id="ms-sandbox-title" className="serif ms-h2">
        Tune your attention
      </h2>
      <p className="ms-lede ms-narrow">Change the scene and see what research says happens to people doing the counting task.</p>

      <div className="ms-sandbox-grid">
        <div className="ms-arena-wrap ms-arena-wrap--sm">
          <canvas
            ref={ref}
            className="ms-arena"
            role="img"
            aria-label={`Looping scene, ${diff} difficulty; the surprise crosses every ${LOOP} seconds${frozen ? "; frozen with labels" : ""}`}
          />
        </div>

        <div className="ms-controls">
          <fieldset className="ms-seg">
            <legend>Task difficulty</legend>
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button key={d} type="button" aria-pressed={diff === d} onClick={() => setDiff(d)}>
                {d[0].toUpperCase() + d.slice(1)}
              </button>
            ))}
          </fieldset>
          <Gauge value={DIFF_READOUT[diff].missed} label="Task difficulty" />
          <p className="ms-readout">{DIFF_READOUT[diff].text}</p>

          <fieldset className="ms-seg">
            <legend>Make the surprise look like…</legend>
            {(
              [
                ["star", "Magenta star"],
                ["white", "Counted shapes"],
                ["dark", "Ignored shapes"],
              ] as [StarLook, string][]
            ).map(([v, l]) => (
              <button key={v} type="button" aria-pressed={look === v} onClick={() => setLook(v)}>
                {l}
              </button>
            ))}
          </fieldset>
          <Gauge value={LOOK_READOUT[look].missed} label="Similarity" />
          <p className="ms-readout">{LOOK_READOUT[look].text}</p>

          <label className="ms-toggle">
            <input type="checkbox" checked={frozen} onChange={(e) => setFrozen(e.target.checked)} />
            <span>Show me everything (freeze and label)</span>
          </label>

          <p className="ms-caption">
            Simplified illustration of published findings, not a prediction about you. Difficulty: {SC1999.cite} (Easy{" "}
            {SC1999.easyNoticedPct}% vs Hard {SC1999.hardNoticedPct}% noticed). Look-alike: {MOST2001.cite} — while counting white
            shapes, a white cross was noticed by {MOST2001.attendWhite.white}%, a black one by {MOST2001.attendWhite.black}% (Exp. 1,{" "}
            {MOST2001.perCondition} people per condition); a unique red cross by {MOST2001.uniqueCrossNoticedPct}% (Exp. 3).
          </p>
        </div>
      </div>
    </section>
  );
}
