"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { makePair, pieceId, type Features } from "@/lib/you-said-that/art";
import { REASON_CHIPS, shownSide, TRIALS } from "@/lib/you-said-that/protocol";
import Piece, { CardBack } from "./Piece";
import type { TrialLog } from "./types";

type Stage = "choose" | "moving" | "down" | "up" | "explain";

// Timings (ms). Identical on every trial — swapped or not — so nothing in the timing gives it away.
const MOVE = 520;
const FLIP = 380;
const HOLD = 1000; // face down for about a second
const FADE = 180; // reduced motion: quick fades instead of the slide and flip

/**
 * One preference trial. The returned card's face is drawn from the `face` state. While the card is
 * face down, `face` is set to pair[shownSide(trial, picked)]: the chosen piece on normal trials, the
 * other piece on trials 4, 7 and 9. Same code path, same layout, same timing either way.
 */
export default function Trial({
  seed,
  index,
  reduced,
  onDone,
}: {
  seed: string;
  index: number;
  reduced: boolean;
  onDone: (log: TrialLog) => void;
}) {
  const pair = useMemo(() => makePair(seed, index), [seed, index]);
  const [stage, setStage] = useState<Stage>("choose");
  const [picked, setPicked] = useState<0 | 1 | null>(null);
  const [face, setFace] = useState<Features | null>(null);
  const [ghost, setGhost] = useState<{ f: Features; x: number; y: number; w: number } | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [chips, setChips] = useState<string[]>([]);
  const [text, setText] = useState("");

  const t0 = useRef(0);
  const rt = useRef(0);
  const table = useRef<HTMLDivElement>(null);
  const cards = [useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null)];
  const held = useRef<HTMLDivElement>(null);
  const fromRect = useRef<DOMRect | null>(null);
  const prompt = useRef<HTMLHeadingElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    t0.current = performance.now();
    const ts = timers.current;
    return () => ts.forEach(clearTimeout);
  }, []);

  const choose = (side: 0 | 1) => {
    if (stage !== "choose") return;
    rt.current = Math.round(performance.now() - t0.current);
    const tb = table.current!.getBoundingClientRect();
    const mine = cards[side].current!.getBoundingClientRect();
    const other = cards[1 - side].current!.getBoundingClientRect();
    fromRect.current = mine;
    setGhost({ f: pair[1 - side], x: other.left - tb.left, y: other.top - tb.top, w: other.width });
    setPicked(side);
    setFace(pair[side]);
    setStage("moving");

    const swapTo = pair[shownSide(index, side)];
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    const move = reduced ? FADE : MOVE;
    const flip = reduced ? FADE : FLIP;
    at(move, () => setStage("down"));
    at(move + flip + HOLD / 2, () => setFace(swapTo)); // the card is face down: nobody can see this happen
    at(move + flip + HOLD, () => setStage("up"));
    at(move + flip + HOLD + flip, () => setStage("explain"));
  };

  // Slide the held card from where the chosen card was (FLIP technique, Web Animations API).
  useLayoutEffect(() => {
    if (stage !== "moving" || !held.current || !fromRect.current) return;
    const to = held.current.getBoundingClientRect();
    const f = fromRect.current;
    if (reduced) {
      held.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE, easing: "ease-out" });
      return;
    }
    const dx = f.left + f.width / 2 - (to.left + to.width / 2);
    const dy = f.top + f.height / 2 - (to.top + to.height / 2);
    const s = f.width / to.width;
    held.current.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: "none" }], {
      duration: MOVE,
      easing: "cubic-bezier(.2,.7,.2,1)",
    });
  }, [stage, reduced]);

  useEffect(() => {
    if (stage === "explain") prompt.current?.focus();
  }, [stage]);

  const canNext = stage === "explain" && (flagged || chips.length > 0 || text.trim().length > 0);
  const finish = () => {
    if (!canNext || picked === null || !face) return;
    onDone({
      pairIds: [pieceId(pair[0]), pieceId(pair[1])],
      picked,
      shownId: pieceId(face),
      flagged,
      rtMs: rt.current,
      chips,
      text,
    });
  };

  // Keyboard: 1 / 2 to choose, X for "That's not what I picked" (not while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (stage === "choose" && (e.key === "1" || e.key === "2")) {
        e.preventDefault();
        choose(e.key === "1" ? 0 : 1);
      } else if (stage === "explain" && (e.key === "x" || e.key === "X")) {
        e.preventDefault();
        setFlagged((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const down = stage === "down";
  const handed = stage !== "choose";

  return (
    <section className="yst-trial" aria-labelledby="yst-trial-q">
      <div className="yst-progress" aria-label={`Pair ${index + 1} of ${TRIALS}`}>
        {Array.from({ length: TRIALS }, (_, i) => (
          <span key={i} className={i < index ? "is-done" : i === index ? "is-now" : ""} />
        ))}
      </div>
      <p className="yst-kicker">
        Pair {index + 1} of {TRIALS}
      </p>
      <h1 id="yst-trial-q" className="serif yst-h2" ref={prompt} tabIndex={-1}>
        {stage === "explain" ? "Why did you choose this one?" : "Which do you prefer?"}
      </h1>

      <div className="yst-table" ref={table}>
        {!handed ? (
          <div className="yst-pair">
            {pair.map((f, i) => (
              <button
                key={i}
                ref={cards[i]}
                className="yst-card yst-card--pick"
                onClick={() => choose(i as 0 | 1)}
                aria-keyshortcuts={String(i + 1)}
                aria-label={`Choose piece ${i + 1}`}
              >
                <Piece f={f} />
                <span className="yst-badge" aria-hidden="true">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="yst-hand">
            <div ref={held} className={`yst-held ${reduced ? "is-reduced" : ""} ${down ? "is-down" : ""}`}>
              <div className="yst-flip">
                <div className="yst-face yst-face--front" data-testid="returned-card">
                  {face && <Piece f={face} />}
                </div>
                <div className="yst-face yst-face--back">
                  <CardBack />
                </div>
              </div>
            </div>
            <p className="yst-chosen-label">{stage === "explain" ? "Your choice" : " "}</p>
          </div>
        )}
        {ghost && (
          <div className={`yst-ghost ${reduced ? "is-reduced" : ""}`} style={{ left: ghost.x, top: ghost.y, width: ghost.w }} aria-hidden="true">
            <Piece f={ghost.f} label={false} />
          </div>
        )}
      </div>

      <div className={`yst-explain ${stage === "explain" ? "is-on" : ""}`} aria-hidden={stage !== "explain"} inert={stage !== "explain"}>
        <div className="yst-chips" role="group" aria-label="Reasons">
          {REASON_CHIPS.map((c) => {
            const on = chips.includes(c);
            return (
              <button key={c} className={`yst-chipbtn ${on ? "is-on" : ""}`} aria-pressed={on} onClick={() => setChips((xs) => (on ? xs.filter((x) => x !== c) : [...xs, c]))}>
                {c}
              </button>
            );
          })}
        </div>
        <label className="yst-textlabel">
          <span>In your own words (optional)</span>
          <textarea
            className="yst-text"
            rows={2}
            maxLength={280}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What made you pick it?"
            autoComplete="off"
          />
        </label>
        <p className="yst-local">Stays on your device. It is never sent anywhere.</p>
        <button className="yst-btn yst-btn--primary" onClick={finish} disabled={!canNext}>
          {index + 1 < TRIALS ? "Next pair" : "Continue"}
        </button>
        {flagged && (
          <p className="yst-flagnote" role="status">
            Noted. Thanks for telling us.
          </p>
        )}
      </div>

      <div className="yst-flagrow">
        <button
          className={`yst-flag ${flagged ? "is-on" : ""}`}
          onClick={() => setFlagged((v) => !v)}
          disabled={stage !== "explain"}
          aria-pressed={flagged}
          aria-keyshortcuts="X"
        >
          {flagged ? "✓ Marked: not what I picked" : "That's not what I picked"}
        </button>
        <span className="yst-keys" aria-hidden="true">
          Keys: 1 / 2 to choose · X: not what I picked
        </span>
      </div>
    </section>
  );
}
