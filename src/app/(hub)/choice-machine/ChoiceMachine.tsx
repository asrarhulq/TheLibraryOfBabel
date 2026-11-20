"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { initialWeights, learn, predict, SIDE_NAME, type Side } from "@/lib/choice-machine/predictor";
import { encodeChoices, SEALED_INDEX, TOTAL } from "@/lib/choice-machine/protocol";
import type { ChoiceMachineStats } from "@/lib/db/choiceMachineRuns";
import Eye, { type EyeState } from "./Eye";
import Tape from "./Tape";
import SealCard from "./SealCard";
import Result from "./Result";
import { commitText, sha256Hex, type Seal } from "./seal";

type Phase = "intro" | "play" | "sealing" | "final" | "opening" | "result";
const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const m = window.matchMedia(RM);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ChoiceMachine() {
  const reduced = useSyncExternalStore(subscribeRM, () => window.matchMedia(RM).matches, () => false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [choices, setChoices] = useState<Side[]>([]);
  const [pressed, setPressed] = useState<Side | null>(null);
  const [seal, setSeal] = useState<Seal | null>(null);
  const [revealed, setRevealed] = useState<Side[] | null>(null);
  const [stats, setStats] = useState<ChoiceMachineStats | null>(null);

  // The machine's working memory. Kept out of React state so its predictions are never rendered
  // (or sitting in the page) before the reveal.
  const weights = useRef(initialWeights());
  const preds = useRef<Side[]>([]);
  const pending = useRef<ReturnType<typeof predict> | null>(null);
  const busy = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  const start = () => {
    weights.current = initialWeights();
    preds.current = [];
    pending.current = predict([], weights.current);
    busy.current = false;
    setChoices([]);
    setSeal(null);
    setRevealed(null);
    setPhase("play");
  };

  const makeSeal = async (h: Side[]) => {
    setPhase("sealing");
    pending.current = predict(h, weights.current);
    const side = pending.current.predicted;
    const salt = [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");
    const [hash] = await Promise.all([sha256Hex(commitText(salt, side)), wait(reduced ? 250 : 1700)]);
    setSeal({ side, salt, hash });
    await wait(reduced ? 100 : 900);
    setPhase("final");
    busy.current = false;
    // the printed card pushes the keys down; make sure they are on screen for the last choice
    window.setTimeout(() => {
      const r = consoleRef.current?.getBoundingClientRect();
      if (r && r.bottom > window.innerHeight) consoleRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "end" });
    }, 60);
  };

  const submit = async (all: Side[]) => {
    const device = window.matchMedia("(pointer: coarse)").matches ? "mobile" : "desktop";
    try {
      await fetch("/api/choice-machine/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ choices: encodeChoices(all), device }),
      });
    } catch {
      /* offline: the result still works locally */
    }
    try {
      const r = await fetch("/api/choice-machine/stats");
      if (r.ok) setStats(await r.json());
    } catch {
      /* no stats then */
    }
  };

  const choose = (side: Side) => {
    if (busy.current || (phase !== "play" && phase !== "final") || !pending.current) return;
    busy.current = true;
    const p = pending.current;
    preds.current = [...preds.current, p.predicted];
    weights.current = learn(weights.current, p.guesses, side);
    const next = [...choices, side];
    setChoices(next);
    setPressed(side);
    window.setTimeout(() => setPressed(null), 160);

    if (phase === "final") {
      setPhase("opening");
      void submit(next);
      return;
    }
    if (next.length === SEALED_INDEX) {
      window.setTimeout(() => void makeSeal(next), reduced ? 120 : 420);
      return;
    }
    pending.current = predict(next, weights.current);
    window.setTimeout(() => (busy.current = false), reduced ? 80 : 260);
  };

  const showResult = () => {
    setRevealed(preds.current);
    setPhase("result");
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }), 450);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "f") {
        e.preventDefault();
        choose(0);
      } else if (k === "arrowright" || k === "j") {
        e.preventDefault();
        choose(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const n = choices.length;
  const lastHit = phase === "opening" || phase === "result" ? seal !== null && choices[SEALED_INDEX] === seal.side : null;
  const eye: EyeState =
    phase === "intro" ? "idle" : phase === "sealing" ? "think" : phase === "final" ? "sealed" : lastHit === null ? "watch" : lastHit ? "hit" : "miss";
  const status =
    phase === "intro"
      ? "Idle"
      : phase === "play"
        ? "Listening"
        : phase === "sealing"
          ? "Writing prediction"
          : phase === "final"
            ? "Sealed · awaiting choice"
            : lastHit
              ? "Prediction correct"
              : "Prediction wrong";
  const counter = phase === "intro" ? "--" : String(Math.min(n + (phase === "play" || phase === "final" || phase === "sealing" ? 1 : 0), TOTAL)).padStart(2, "0");
  const keysLive = phase === "play" || phase === "final";

  return (
    <div className="cm-wrap">
      <header className={`cm-head ${phase === "intro" ? "" : "is-compact"}`}>
        <p className="cm-kicker">Prediction and free will</p>
        <h1 className="serif cm-title">The Choice Machine</h1>
        {phase === "intro" && (
          <p className="cm-lede">
            Eleven choices, left or right. Go with your gut and don&rsquo;t think about it. Before your last choice, the machine
            will seal its prediction.
          </p>
        )}
      </header>

      <section className={`cm-machine ${reduced ? "is-reduced" : ""}`} data-phase={phase} aria-label="The machine">
        <div className="cm-plate">
          <span>Model XI</span>
          <span className="cm-plate-name">Choice Machine</span>
          <span>Est. 2026</span>
        </div>

        <div className="cm-core">
          <div className="cm-dial" aria-hidden="true">
            <span className="cm-dial-label">Choice</span>
            <span className="cm-digits">{counter}</span>
            <span className="cm-dial-of">of {TOTAL}</span>
          </div>
          <Eye state={eye} timerKey={phase === "play" && !reduced ? n : undefined} />
          <div className="cm-dial cm-dial--right" aria-hidden="true">
            <span className="cm-dial-label">Status</span>
            <span className={`cm-lamp ${eye}`} />
            <span className="cm-status">{status}</span>
          </div>
        </div>

        {(phase === "sealing" || phase === "final" || phase === "opening" || phase === "result") && (
          <div className="cm-slot">
            <SealCard
              state={phase === "sealing" && !seal ? "printing" : phase === "sealing" || phase === "final" ? "sealed" : "open"}
              hash={seal?.hash ?? ""}
              side={phase === "opening" || phase === "result" ? (seal?.side ?? null) : null}
            />
          </div>
        )}

        <Tape choices={choices} predictions={revealed} current={keysLive ? n : -1} />

        <div className="cm-console" ref={consoleRef}>
          {phase === "intro" ? (
            <div className="cm-intro-actions">
              <button className="cm-start" onClick={start}>
                Start the machine
              </button>
              <p className="cm-hint">Use the two keys, or ← and → on a keyboard. About a minute.</p>
            </div>
          ) : (
            <>
              <p className="cm-prompt serif" aria-live="polite">
                {phase === "play" && (n === 0 ? "Left or right?" : "And now?")}
                {phase === "sealing" && "The machine is making its prediction…"}
                {phase === "final" && "Its prediction is sealed. Choose freely."}
                {(phase === "opening" || phase === "result") && (lastHit ? "It knew." : "You beat it.")}
              </p>
              {phase === "opening" || phase === "result" ? (
                <div className="cm-verdict">
                  <p>
                    It sealed <strong>{seal ? SIDE_NAME[seal.side] : ""}</strong> before you chose. You chose{" "}
                    <strong>{SIDE_NAME[choices[SEALED_INDEX] ?? 0]}</strong>.
                  </p>
                  {phase === "opening" && (
                    <button className="cm-start" onClick={showResult}>
                      See how it read you
                    </button>
                  )}
                </div>
              ) : (
                <div className="cm-keys">
                  {([0, 1] as Side[]).map((s) => (
                    <button
                      key={s}
                      className={`cm-key ${pressed === s ? "is-pressed" : ""}`}
                      onClick={() => choose(s)}
                      disabled={!keysLive}
                      aria-keyshortcuts={s === 0 ? "ArrowLeft F" : "ArrowRight J"}
                    >
                      <span className="cm-key-cap">
                        <span className="cm-key-arrow" aria-hidden="true">
                          {s === 0 ? "←" : "→"}
                        </span>
                        <span className="cm-key-word">{SIDE_NAME[s]}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <div ref={resultRef}>
        {phase === "result" && seal && revealed && (
          <Result choices={choices} seal={seal} stats={stats} onAgain={start} reduced={reduced} />
        )}
      </div>
    </div>
  );
}
