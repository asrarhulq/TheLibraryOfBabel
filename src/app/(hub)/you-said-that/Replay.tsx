"use client";

import { useEffect, useRef, useState } from "react";
import { nickname, pieceId } from "@/lib/you-said-that/art";
import { stanceLabel, STATEMENTS } from "@/lib/you-said-that/protocol";
import type { ReplayItem } from "@/lib/you-said-that/replay";
import Piece, { CardBack } from "./Piece";
import { MiniScale } from "./Values";

// Slow-motion replay of one swapped item: what you picked → the hidden moment → what you were shown
// (glowing) → what you said about it. Every frame is drawn from the run's log.
const STEPS = 4; // 0 picked, 1 face down, 2 swapped + glow, 3 what you wrote

export default function Replay({
  item,
  step,
  total,
  reduced,
  wrote,
  onNext,
}: {
  item: ReplayItem;
  step: number;
  total: number;
  reduced: boolean;
  wrote: { chips?: string[]; text?: string } | null;
  onNext: () => void;
}) {
  const [f, setF] = useState(0);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const gap = reduced ? 700 : 1500;
    const ts = Array.from({ length: STEPS - 1 }, (_, k) => window.setTimeout(() => setF(k + 1), gap * (k + 1)));
    return () => ts.forEach(clearTimeout);
  }, [reduced]);
  useEffect(() => {
    if (f === STEPS - 1) btn.current?.focus();
  }, [f]);

  const done = f >= STEPS - 1;
  const last = step + 1 >= total;
  const showsSwap = f >= 2;

  return (
    <div
      className={`yst-replay ${done ? "is-done" : ""} ${reduced ? "is-reduced" : ""}`}
      data-step={step}
      data-kind={item.kind}
      data-index={item.index}
      data-picked={item.kind === "pick" ? item.pickedId : item.value}
      data-shown={item.kind === "pick" ? item.shownId : item.shown}
    >
      <p className="yst-kicker">
        Swap {step + 1} of {total} · {item.kind === "pick" ? `Pair ${item.index + 1}` : "Your answers"}
      </p>

      {item.kind === "pick" ? (
        <div className="yst-rp-row">
          <figure className="yst-rp-col">
            <div className="yst-rp-card">
              <Piece f={item.picked} />
            </div>
            <figcaption>
              <span className="yst-rp-arrow" aria-hidden="true">
                ↑
              </span>
              <strong>You picked</strong> {nickname(item.picked)}
            </figcaption>
          </figure>
          <span className="yst-rp-sep" aria-hidden="true">
            →
          </span>
          <figure className={`yst-rp-col ${f >= 1 ? "is-on" : ""}`}>
            <div className={`yst-rp-card yst-held yst-rp-flip ${reduced ? "is-reduced" : ""} ${f === 1 ? "is-down" : ""} ${showsSwap ? "is-glow" : ""}`}>
              <div className="yst-flip">
                <div className="yst-face yst-face--front" data-piece-shown={f === 0 ? item.pickedId : item.shownId}>
                  <Piece f={f >= 2 ? item.shown : item.picked} />
                </div>
                <div className="yst-face yst-face--back">
                  <CardBack />
                </div>
              </div>
            </div>
            <figcaption>
              {f < 2 ? (
                <>Face down for a second…</>
              ) : (
                <>
                  <strong>You were shown</strong> {nickname(item.shown)}
                  {pieceId(item.shown) !== item.pickedId && <span className="yst-tag">swapped</span>}
                </>
              )}
            </figcaption>
          </figure>
        </div>
      ) : (
        <div className="yst-rp-stmt">
          <p className="serif yst-stmt-text">{STATEMENTS[item.index]}</p>
          <div className="yst-rp-row yst-rp-row--stmt">
            <div className="yst-rp-ans">
              <small>You answered</small>
              <strong>{stanceLabel(item.value)}</strong>
              <MiniScale v={item.value} />
            </div>
            <span className="yst-rp-sep" aria-hidden="true">
              →
            </span>
            <div className={`yst-rp-ans yst-rp-sheet ${f === 1 ? "is-away" : ""} ${showsSwap ? "is-glow" : ""} ${f >= 1 ? "is-on" : ""}`}>
              <small>{f < 2 ? "Collected…" : "The summary showed"}</small>
              <strong>{f < 2 ? " " : stanceLabel(item.shown)}</strong>
              {f >= 2 ? <MiniScale v={item.shown} /> : <span className="yst-mini" />}
            </div>
          </div>
        </div>
      )}

      <div className={`yst-rp-said ${f >= 3 ? "is-on" : ""}`} aria-live="polite">
        {f >= 3 &&
          (item.flagged ? (
            <p>
              <strong>✓ You flagged it:</strong> &ldquo;{item.kind === "pick" ? "That's not what I picked" : "That's not what I answered"}.&rdquo;
            </p>
          ) : item.kind === "stmt" && !item.selected ? (
            <p>
              You didn&rsquo;t flag it, but you didn&rsquo;t pick it as one to explain either. It passed quietly.
            </p>
          ) : (
            <p>
              <strong>{item.kind === "pick" ? "Then you explained why you chose it:" : "Then you explained your stance:"}</strong>{" "}
              <span className="yst-wrote">
                {wrote?.text?.trim() ? `“${wrote.text.trim()}”` : ""}
                {wrote?.chips?.length ? ` ${wrote.chips.join(" · ")}` : ""}
                {!wrote?.text?.trim() && !wrote?.chips?.length ? "(a reason you gave)" : ""}
              </span>
            </p>
          ))}
      </div>

      <div className="yst-rp-nav">
        <button ref={btn} className="yst-btn yst-btn--primary" onClick={onNext} disabled={!done}>
          {last ? "See your result" : "Next swap"}
        </button>
      </div>
    </div>
  );
}
