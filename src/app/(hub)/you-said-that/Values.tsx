"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  reversedStatements,
  SCALE_MAX,
  SCALE_MID,
  SCALE_MIN,
  shownValue,
  stanceLabel,
  STATEMENTS,
  STRONGEST_COUNT,
} from "@/lib/you-said-that/protocol";
import type { Part2Log } from "./types";

type Stage = { k: "intro" } | { k: "rate"; i: number } | { k: "summary" } | { k: "explain"; n: number };

/** A small 9-step scale with the answer marked; words carry the meaning, not colour. */
export function MiniScale({ v }: { v: number }) {
  return (
    <span className="yst-mini" aria-hidden="true">
      <small>Disagree</small>
      {Array.from({ length: SCALE_MAX - SCALE_MIN + 1 }, (_, k) => (
        <i key={k} className={k + SCALE_MIN === v ? "is-on" : k + SCALE_MIN === SCALE_MID ? "is-mid" : ""} />
      ))}
      <small>Agree</small>
    </span>
  );
}

function StatementCard({
  i,
  v,
  flagged,
  onFlag,
  children,
}: {
  i: number;
  v: number;
  flagged: boolean;
  onFlag: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="yst-stmt-body">
      <p className="serif yst-stmt-text">{STATEMENTS[i]}</p>
      <p className="yst-stance" data-shown-value={v}>
        <strong>{stanceLabel(v)}.</strong>
        <MiniScale v={v} />
      </p>
      <div className="yst-stmt-actions">
        {children}
        <button className={`yst-flag yst-flag--sm ${flagged ? "is-on" : ""}`} aria-pressed={flagged} onClick={onFlag}>
          {flagged ? "✓ Marked: not what I answered" : "That's not what I answered"}
        </button>
      </div>
    </div>
  );
}

export default function Values({ seed, reduced, onDone }: { seed: string; reduced: boolean; onDone: (log: Part2Log) => void }) {
  const [stage, setStage] = useState<Stage>({ k: "intro" });
  const [values, setValues] = useState<(number | null)[]>(() => STATEMENTS.map(() => null));
  const [flagged, setFlagged] = useState<boolean[]>(() => STATEMENTS.map(() => false));
  const [strongest, setStrongest] = useState<number[]>([]);
  const [texts, setTexts] = useState<Record<number, string>>({});
  const [back, setBack] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  // What each summary card displays. Two of them are mirrored across the middle of the scale.
  const shown = useMemo(() => {
    if (values.some((v) => v === null)) return null;
    const vs = values as number[];
    const rev = reversedStatements(seed, vs);
    return vs.map((v, i) => shownValue(seed, i, v, rev.includes(i)));
  }, [seed, values]);

  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0 });
  }, [stage]);

  // Summary: the answer cards are collected (slide away) and handed back, the same for every card.
  useEffect(() => {
    if (stage.k !== "summary") return;
    const t = window.setTimeout(() => setBack(true), reduced ? 500 : 1300);
    return () => clearTimeout(t);
  }, [stage.k, reduced]);

  const flag = (i: number) => setFlagged((f) => f.map((x, k) => (k === i ? !x : x)));

  if (stage.k === "intro")
    return (
      <section className="yst-stage yst-enter">
        <p className="yst-kicker">Part 2</p>
        <h1 className="serif yst-h1" ref={heading} tabIndex={-1}>
          What do you believe?
        </h1>
        <p className="yst-lede">Eight short statements about everyday values. There are no right answers: just say how much you agree.</p>
        <button className="yst-btn yst-btn--primary" onClick={() => setStage({ k: "rate", i: 0 })}>
          Begin
        </button>
      </section>
    );

  if (stage.k === "rate") {
    const i = stage.i;
    const v = values[i];
    const set = (n: number) => setValues((vs) => vs.map((x, k) => (k === i ? n : x)));
    return (
      <section className="yst-stage yst-rate" key={i}>
        <div className="yst-progress" aria-hidden="true">
          {STATEMENTS.map((_, k) => (
            <span key={k} className={k < i ? "is-done" : k === i ? "is-now" : ""} />
          ))}
        </div>
        <p className="yst-kicker">
          Statement {i + 1} of {STATEMENTS.length}
        </p>
        <h1 className="serif yst-statement" ref={heading} tabIndex={-1} id={`yst-st-${i}`}>
          {STATEMENTS[i]}
        </h1>
        <div className={`yst-slider ${v === null ? "is-untouched" : ""}`}>
          <input
            type="range"
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={1}
            value={v ?? SCALE_MID}
            aria-labelledby={`yst-st-${i}`}
            aria-valuetext={v === null ? "Not answered yet" : stanceLabel(v).replace("You ", "")}
            onChange={(e) => set(Number(e.target.value))}
            onPointerDown={() => v === null && set(SCALE_MID)}
            onKeyDown={(e) => v === null && (e.key === "Enter" || e.key === " ") && set(SCALE_MID)}
          />
          <div className="yst-slider-ends" aria-hidden="true">
            <span>Strongly disagree</span>
            <span>Strongly agree</span>
          </div>
        </div>
        <p className="yst-stance-live" aria-live="polite">
          {v === null ? "Drag the slider, or use the arrow keys." : `${stanceLabel(v)}.`}
        </p>
        <button
          className="yst-btn yst-btn--primary"
          disabled={v === null}
          onClick={() => setStage(i + 1 < STATEMENTS.length ? { k: "rate", i: i + 1 } : { k: "summary" })}
        >
          {i + 1 < STATEMENTS.length ? "Next" : "See my answers"}
        </button>
      </section>
    );
  }

  if (stage.k === "summary" && shown) {
    const full = strongest.length >= STRONGEST_COUNT;
    return (
      <section className="yst-summary">
        <p className="yst-kicker">Part 2</p>
        <h1 className="serif yst-h1" ref={heading} tabIndex={-1}>
          {back ? "Here is what you told us" : "Collecting your answers…"}
        </h1>
        <p className="yst-lede" aria-live="polite">
          {back ? `Pick the ${STRONGEST_COUNT} statements you feel strongest about. You'll explain your stance in a sentence.` : " "}
        </p>
        <ul className={`yst-sheets ${back ? "is-back" : "is-away"} ${reduced ? "is-reduced" : ""}`} role="list">
          {STATEMENTS.map((_, i) => {
            const sel = strongest.includes(i);
            return (
              <li key={i} className={`yst-sheet ${sel ? "is-sel" : ""}`} style={{ "--d": `${i * 70}ms` } as React.CSSProperties} data-statement={i}>
                {back ? (
                  <StatementCard i={i} v={shown[i]} flagged={flagged[i]} onFlag={() => flag(i)}>
                    <button
                      className={`yst-sel ${sel ? "is-on" : ""}`}
                      aria-pressed={sel}
                      disabled={!sel && full}
                      onClick={() => setStrongest((s) => (sel ? s.filter((x) => x !== i) : [...s, i]))}
                    >
                      {sel ? "★ I feel strongly" : "☆ I feel strongly about this"}
                    </button>
                  </StatementCard>
                ) : (
                  <div className="yst-stmt-body">
                    <p className="serif yst-stmt-text">{STATEMENTS[i]}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {back && (
          <div className="yst-sticky">
            <span>
              {strongest.length} of {STRONGEST_COUNT} picked
            </span>
            <button className="yst-btn yst-btn--primary" disabled={!full} onClick={() => setStage({ k: "explain", n: 0 })}>
              Continue
            </button>
          </div>
        )}
      </section>
    );
  }

  if (stage.k === "explain" && shown) {
    const i = strongest[stage.n];
    const text = texts[i] ?? "";
    const ok = flagged[i] || text.trim().length > 0;
    const last = stage.n + 1 >= STRONGEST_COUNT;
    return (
      <section className="yst-stage yst-explain-stmt" key={i}>
        <p className="yst-kicker">
          {stage.n + 1} of {STRONGEST_COUNT}
        </p>
        <h1 className="serif yst-h2" ref={heading} tabIndex={-1}>
          Explain your stance in a sentence
        </h1>
        <div className="yst-sheet yst-sheet--solo" data-statement={i}>
          <StatementCard i={i} v={shown[i]} flagged={flagged[i]} onFlag={() => flag(i)} />
        </div>
        <label className="yst-textlabel yst-narrowbox">
          <span>Why do you feel this way?</span>
          <textarea
            className="yst-text"
            rows={3}
            maxLength={400}
            value={text}
            onChange={(e) => setTexts((t) => ({ ...t, [i]: e.target.value }))}
            autoComplete="off"
          />
        </label>
        <p className="yst-local yst-narrowbox">Stays on your device. It is never sent anywhere.</p>
        <button
          className="yst-btn yst-btn--primary"
          disabled={!ok}
          onClick={() =>
            last
              ? onDone({ values: values as number[], shownValues: shown, flagged, strongest, texts })
              : setStage({ k: "explain", n: stage.n + 1 })
          }
        >
          {last ? "Finish" : "Next"}
        </button>
      </section>
    );
  }
  return null;
}
