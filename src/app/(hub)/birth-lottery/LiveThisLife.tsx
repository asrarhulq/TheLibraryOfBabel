"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { seededRandom } from "@/lib/birth-lottery/rng";
import { yearLabel } from "@/lib/birth-lottery/format";
import type { RollResult } from "@/lib/birth-lottery/types";

// 100 babies born in your region and era. Dots fade out at the ages the survival curve
// implies; one of them is you.

const END = 80;
const DURATION_MS = 16000;

/** Age (completed years) at which the person at survival quantile p dies; null = alive at 80. */
function deathAge(lx: number[], p: number): number | null {
  for (let x = 0; x < END; x++) if (p < 1 - lx[x + 1]) return x;
  return null;
}

export default function LiveThisLife({ r }: { r: RollResult }) {
  const [age, setAge] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  const startRef = useRef<{ t0: number; from: number } | null>(null);

  // Dot i stands for the (i + 0.5)th percentile of the cohort; "you" use your own draw.
  const dots = useMemo(() => {
    const rand = seededRandom(`${r.seed}|dots`);
    const order = Array.from({ length: 100 }, (_, i) => i);
    for (let i = 99; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order.map((cohortIndex) => ({
      you: cohortIndex === r.youIndex,
      dies: cohortIndex === r.youIndex ? r.outcomeAge : deathAge(r.lx, (cohortIndex + 0.5) / 100),
    }));
  }, [r]);

  const play = () => {
    const from = age >= END ? 0 : age;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAge(END);
      return;
    }
    const t0 = performance.now();
    startRef.current = { t0, from };
    const loop = (now: number) => {
      if (!startRef.current) return;
      const a = Math.min(END, from + ((now - t0) / DURATION_MS) * END);
      setAge(a);
      if (a < END) raf.current = requestAnimationFrame(loop);
      else {
        setPlaying(false);
        startRef.current = null;
      }
    };
    setPlaying(true);
    raf.current = requestAnimationFrame(loop);
  };
  const pause = () => {
    cancelAnimationFrame(raf.current);
    startRef.current = null;
    setPlaying(false);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const whole = Math.floor(age);
  const aliveCount = dots.filter((d) => d.dies === null || d.dies >= whole).length;
  const youGone = r.outcomeAge !== null && whole > r.outcomeAge;
  const finished = age >= END;
  const lifespan = r.outcomeAge ?? END;
  const lastAgeYear = r.year + whole;

  let reveal: string | null = null;
  if (youGone) {
    reveal =
      r.outcomeAge === 0
        ? "You did not live to see your first birthday."
        : r.outcomeAge! < 5
          ? `You lived to ${r.outcomeAge}.`
          : `You lived to ${r.outcomeAge}.`;
  } else if (finished) reveal = "You were still alive at 80.";

  return (
    <section className="bl-life" aria-labelledby="bl-life-title">
      <h2 id="bl-life-title" className="serif">
        One life, year by year
      </h2>
      <p className="bl-life-sub">
        100 babies born in {r.region.name} around {r.yearLabel}. One of them is you.
      </p>

      <div className="bl-life-stage">
        <svg className="bl-dots" viewBox="0 0 220 220" role="img" aria-label={`${aliveCount} of 100 still alive at age ${whole}`}>
          {dots.map((d, i) => {
            const x = 12 + (i % 10) * 22;
            const y = 12 + Math.floor(i / 10) * 22;
            const gone = d.dies !== null && whole > d.dies;
            return (
              <g key={i} className={`bl-dot ${gone ? "is-gone" : ""} ${d.you ? "is-you" : ""}`}>
                {d.you && <circle cx={x} cy={y} r="9.5" className="bl-dot-ring" />}
                <circle cx={x} cy={y} r="6" />
              </g>
            );
          })}
        </svg>

        <div className="bl-life-side">
          <p className="bl-age">
            <span className="serif">{whole}</span>
            <small>years old · {yearLabel(lastAgeYear)}</small>
          </p>
          <p className="bl-alive">
            <strong>{aliveCount}</strong> of 100 still alive
          </p>
          <p className="bl-reveal serif" aria-live="polite">
            {reveal ?? " "}
          </p>
        </div>
      </div>

      <div className="bl-controls">
        <button className="bl-btn" onClick={playing ? pause : play} aria-label={playing ? "Pause" : finished ? "Replay" : "Play"}>
          {playing ? "Pause" : finished ? "Replay" : age > 0 ? "Resume" : "Play"}
        </button>
        <div className="bl-scrub">
          <input
            type="range"
            min={0}
            max={END}
            step={1}
            value={whole}
            onChange={(e) => {
              pause();
              setAge(Number(e.target.value));
            }}
            aria-label="Age"
            aria-valuetext={`Age ${whole}, ${aliveCount} of 100 alive`}
          />
          <div className="bl-marks" aria-hidden="true">
            {r.milestones.map((m) => (
              <span
                key={m.year}
                className={`bl-mark ${whole >= m.year - r.year ? "is-past" : ""}`}
                style={{ left: `${((m.year - r.year) / END) * 100}%` }}
                title={`${yearLabel(m.year)}: ${m.label}`}
              />
            ))}
            {r.outcomeAge !== null && <span className="bl-mark bl-mark--you" style={{ left: `${(lifespan / END) * 100}%` }} />}
          </div>
        </div>
      </div>

      {r.milestones.length > 0 && (
        <ol className="bl-milestones">
          {r.milestones.map((m) => (
            <li key={m.year} className={whole >= m.year - r.year ? "is-past" : ""}>
              <span className="bl-ms-age">age {m.year - r.year}</span>
              <span>
                {yearLabel(m.year)} — {m.label}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
