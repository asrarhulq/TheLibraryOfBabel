"use client";

import { useEffect, useMemo, useState } from "react";
import { makePair, nickname } from "@/lib/you-said-that/art";
import { MANIPULATED_TRIALS } from "@/lib/you-said-that/protocol";
import Piece, { CardBack } from "./Piece";
import type { TrialLog } from "./types";

const FRAMES = ["Face up: what you picked", "Face down: the variable changes", "Face up: what you were shown"];

/** The hidden state change, animated next to what the screen showed. */
export default function HowItWorks({ seed, trials, reduced }: { seed: string; trials: TrialLog[]; reduced: boolean }) {
  const [open, setOpen] = useState(false);
  const [frame, setFrame] = useState(0);
  const k = MANIPULATED_TRIALS[0];
  const pair = useMemo(() => makePair(seed, k), [seed, k]);
  const picked = pair[trials[k].picked];
  const other = pair[1 - trials[k].picked];

  useEffect(() => {
    if (!open || reduced) return;
    const t = window.setInterval(() => setFrame((f) => (f + 1) % 3), 1700);
    return () => clearInterval(t);
  }, [open, reduced]);

  const face = frame >= 1 ? "B" : "A"; // it changes while the card is face down
  return (
    <section className="yst-sec yst-how">
      <button className="yst-btn" aria-expanded={open} aria-controls="yst-how-panel" onClick={() => setOpen((o) => !o)}>
        {open ? "Hide how the trick works" : "How the trick works"}
      </button>
      <div id="yst-how-panel" hidden={!open} className="yst-how-panel">
        {reduced ? (
          <div className="yst-how-frames">
            {[picked, null, other].map((f, n) => (
              <figure key={n}>
                <div className="yst-how-card">{f ? <Piece f={f} label={false} /> : <CardBack />}</div>
                <figcaption>{FRAMES[n]}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="yst-how-grid">
            <figure>
              <p className="yst-how-label">What you saw</p>
              <div className={`yst-how-card yst-held ${frame === 1 ? "is-down" : ""}`}>
                <div className="yst-flip">
                  <div className="yst-face yst-face--front">
                    <Piece f={frame === 2 ? other : picked} label={false} />
                  </div>
                  <div className="yst-face yst-face--back">
                    <CardBack />
                  </div>
                </div>
              </div>
              <figcaption aria-live="polite">{FRAMES[frame]}</figcaption>
            </figure>
            <figure className="yst-how-state">
              <p className="yst-how-label">What the page was doing</p>
              <pre aria-label="Hidden state">
                <code>
                  <span>picked    = A</span>
                  {"\n"}
                  <span className={frame >= 1 ? "is-hot" : ""}>card.face = {face}</span>
                  {"\n"}
                  <span>layout    = same as every pair</span>
                  {"\n"}
                  <span>timing    = same as every pair</span>
                </code>
              </pre>
              <figcaption>
                A = {nickname(picked)}, B = {nickname(other)} (your pair {k + 1})
              </figcaption>
            </figure>
          </div>
        )}
        <p className="yst-how-text">
          The returned card is drawn from one variable. While the card is face down, that variable is set to the piece you didn&rsquo;t
          pick on pairs 4, 7 and 9, and to the piece you did pick on every other pair. It is the same code, the same layout and the
          same timing either way, so nothing on the screen could give it away. You could only notice by remembering what you chose.
          In the original study a hidden second card did the same job (a &ldquo;double-card ploy&rdquo;).
        </p>
      </div>
    </section>
  );
}
