"use client";

import { useEffect, useMemo, useState } from "react";
import { makePair, pieceId } from "@/lib/you-said-that/art";
import { isManipulatedTrial, TRIALS } from "@/lib/you-said-that/protocol";
import { rngFor } from "@/lib/you-said-that/rng";
import Piece from "./Piece";
import type { TrialLog } from "./types";

/**
 * All ten pairs again, no trick. Sides are re-shuffled so the answer is about the piece, not the
 * position. Compares with the original picks: a rough measure of how stable the preferences are.
 */
export default function ChooseAgain({ seed, trials }: { seed: string; trials: TrialLog[] }) {
  const [i, setI] = useState<number | null>(null);
  const [again, setAgain] = useState<string[]>([]);

  const pairs = useMemo(
    () =>
      Array.from({ length: TRIALS }, (_, k) => {
        const p = makePair(seed, k);
        return rngFor(`yst:${seed}:again:${k}`)() < 0.5 ? p : ([p[1], p[0]] as typeof p);
      }),
    [seed]
  );

  const choose = (side: 0 | 1) => {
    if (i === null) return;
    setAgain((a) => [...a, pieceId(pairs[i][side])]);
    setI(i + 1 < TRIALS ? i + 1 : -1);
  };

  useEffect(() => {
    if (i === null || i < 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1" || e.key === "2") {
        e.preventDefault();
        choose(e.key === "1" ? 0 : 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const original = trials.map((t) => t.pairIds[t.picked]);
  const same = again.filter((id, k) => id === original[k]).length;
  const swapped = trials.map((_, k) => k).filter(isManipulatedTrial);
  const backToOriginal = swapped.filter((k) => again[k] === original[k]).length;

  return (
    <section className="yst-sec yst-again-sec" aria-labelledby="yst-again-h">
      <h2 id="yst-again-h" className="serif yst-h2">
        Choose again
      </h2>
      {i === null ? (
        <>
          <p className="yst-lede">The same ten pairs again, with no swaps. The sides are shuffled.</p>
          <button className="yst-btn yst-btn--primary" onClick={() => setI(0)}>
            Choose again
          </button>
        </>
      ) : i >= 0 ? (
        <>
          <p className="yst-kicker">
            Pair {i + 1} of {TRIALS}
            {isManipulatedTrial(i) ? " · one of the swapped pairs" : ""}
          </p>
          <div className="yst-pair yst-pair--sm" key={i}>
            {pairs[i].map((f, s) => (
              <button key={s} className="yst-card yst-card--pick" onClick={() => choose(s as 0 | 1)} aria-label={`Choose piece ${s + 1}`} aria-keyshortcuts={String(s + 1)}>
                <Piece f={f} />
                <span className="yst-badge" aria-hidden="true">
                  {s + 1}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="serif yst-big" role="status">
            You chose the same one <strong>{same}</strong> of {TRIALS} times.
          </p>
          <ol className="yst-strip" aria-label="Pair by pair">
            {again.map((id, k) => {
              const kept = id === original[k];
              return (
                <li key={k} className={kept ? "is-same" : "is-changed"}>
                  <span aria-hidden="true">{kept ? "=" : "≠"}</span>
                  <small>
                    {k + 1}
                    {isManipulatedTrial(k) ? "*" : ""}
                  </small>
                  <span className="visually-hidden">
                    Pair {k + 1}
                    {isManipulatedTrial(k) ? " (swapped)" : ""}: {kept ? "same as before" : "changed"}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="yst-dim">
            * the swapped pairs. On those, you went back to your original pick {backToOriginal} of {swapped.length} times
            {backToOriginal < swapped.length ? ", and chose the piece you'd been handed instead" : ""}
            {backToOriginal < swapped.length ? ` ${swapped.length - backToOriginal} ${swapped.length - backToOriginal === 1 ? "time" : "times"}` : ""}. Preferences
            for abstract shapes are weak, so some changes are expected.
          </p>
        </>
      )}
    </section>
  );
}
