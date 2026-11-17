"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DRM_LISTS, LURES, buildTest, shuffle, type Lure, type TestItem, type TestResponse } from "@/lib/memory/drm";
import Reveal from "./Reveal";

const WORD_MS = 1200;
const LIST_GAP_MS = 1700;
const DISTRACTOR_SECONDS = 35;

/** Keep the latest callback without re-triggering effects (timers must not restart on parent re-render). */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

type Phase = "intro" | "study" | "distractor" | "testIntro" | "test" | "reveal";

function newSessionId(): string {
  const c = globalThis.crypto;
  if (typeof c.randomUUID === "function") return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

interface Session {
  id: string;
  listOrder: Lure[];
  test: TestItem[];
}

function newSession(): Session {
  return { id: newSessionId(), listOrder: shuffle(LURES), test: buildTest() };
}

export default function MemoryExperience() {
  // Created when the user starts (client-only), so the random order is never baked into SSR HTML.
  const [session, setSession] = useState<Session | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [responses, setResponses] = useState<TestResponse[]>([]);

  const start = useCallback(() => {
    setSession(newSession());
    setResponses([]);
    setPhase("study");
    window.scrollTo({ top: 0 });
  }, []);

  if (phase === "intro" || !session) return <Intro onStart={start} />;

  return (
    <>
      {phase === "study" && <Study key={session.id} order={session.listOrder} onDone={() => setPhase("distractor")} />}
      {phase === "distractor" && <Distractor onDone={() => setPhase("testIntro")} />}
      {phase === "testIntro" && <TestIntro count={session.test.length} onStart={() => setPhase("test")} />}
      {phase === "test" && (
        <Test
          items={session.test}
          onDone={(r) => {
            setResponses(r);
            setPhase("reveal");
          }}
        />
      )}
      {phase === "reveal" && <Reveal sessionId={session.id} responses={responses} onRestart={start} />}
    </>
  );
}

// ── Intro ───────────────────────────────────────────────────────────────────

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="mem-stage mem-intro mem-enter">
      <p className="mem-kicker">Experiment No. 002</p>
      <h1 className="serif mem-title">Memory That Lies</h1>
      <p className="mem-lede">
        You&rsquo;ll study five short lists of words, shown one at a time. Just read each word and try to remember it — no
        need to write anything down. After a short break, we&rsquo;ll test how many you remember. It takes about four
        minutes.
      </p>
      <button className="mem-btn mem-btn--primary" onClick={onStart} autoFocus>
        Begin studying
      </button>
      <p className="mem-hint">Find a quiet moment — the words go by quickly.</p>
    </section>
  );
}

// ── Study ───────────────────────────────────────────────────────────────────

function Study({ order, onDone }: { order: Lure[]; onDone: () => void }) {
  const [listIdx, setListIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(-1); // -1 = "List n of 5" card
  const done = useLatest(onDone);

  useEffect(() => {
    const t = setTimeout(
      () => {
        if (wordIdx < DRM_LISTS[order[listIdx]].length - 1) {
          setWordIdx(wordIdx + 1);
        } else if (listIdx < order.length - 1) {
          setListIdx(listIdx + 1);
          setWordIdx(-1);
        } else {
          done.current();
        }
      },
      wordIdx === -1 ? LIST_GAP_MS : WORD_MS
    );
    return () => clearTimeout(t);
  }, [listIdx, wordIdx, order, done]);

  const list = DRM_LISTS[order[listIdx]];
  const total = order.length * list.length;
  const shown = listIdx * list.length + Math.max(0, wordIdx);

  return (
    <section className="mem-stage mem-study" aria-label="Study phase">
      <div className="mem-study-top">
        <span>
          List {listIdx + 1} of {order.length}
        </span>
        <span className="mem-progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${shown / total})` }} />
        </span>
      </div>
      <div className="mem-word-wrap" aria-live="polite">
        {wordIdx === -1 ? (
          <p key={`gap-${listIdx}`} className="mem-listcard">
            <span className="serif">List {listIdx + 1}</span>
            <small>Get ready…</small>
          </p>
        ) : (
          <p key={`${listIdx}-${wordIdx}`} className="serif mem-word">
            {list[wordIdx]}
          </p>
        )}
      </div>
    </section>
  );
}

// ── Distractor: quick arithmetic ────────────────────────────────────────────

interface Problem {
  text: string;
  answer: number;
  options: number[];
}

function makeProblem(): Problem {
  const plus = Math.random() < 0.55;
  let a = 12 + Math.floor(Math.random() * 38);
  let b = 3 + Math.floor(Math.random() * 17);
  if (!plus && b > a) [a, b] = [b, a];
  const answer = plus ? a + b : a - b;
  const wrong = new Set<number>();
  for (const d of shuffle([1, -1, 2, -2, 10, -10, 3])) {
    if (wrong.size >= 2) break;
    if (answer + d >= 0) wrong.add(answer + d);
  }
  return { text: `${a} ${plus ? "+" : "−"} ${b}`, answer, options: shuffle([answer, ...wrong]) };
}

function Distractor({ onDone }: { onDone: () => void }) {
  const [problem, setProblem] = useState<Problem>(makeProblem);
  const [left, setLeft] = useState(DISTRACTOR_SECONDS);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [flash, setFlash] = useState<"ok" | "no" | null>(null);
  const deadline = useRef(0);
  const done = useLatest(onDone);

  useEffect(() => {
    deadline.current = Date.now() + DISTRACTOR_SECONDS * 1000;
    const iv = setInterval(() => {
      const s = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) {
        clearInterval(iv);
        done.current();
      }
    }, 200);
    return () => clearInterval(iv);
  }, [done]);

  const answer = useCallback(
    (n: number) => {
      const ok = n === problem.answer;
      setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }));
      setFlash(ok ? "ok" : "no");
      setProblem(makeProblem());
    },
    [problem]
  );

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 350);
    return () => clearTimeout(t);
  }, [flash]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const i = ["1", "2", "3"].indexOf(e.key);
      if (i >= 0 && problem.options[i] !== undefined) answer(problem.options[i]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [problem, answer]);

  return (
    <section className="mem-stage mem-distract mem-enter" aria-label="Short break: quick sums">
      <p className="mem-kicker">Short break</p>
      <h2 className="serif mem-h2">Quick sums, as many as you can</h2>
      <div className="mem-timer" role="timer" aria-label={`${left} seconds left`}>
        <span style={{ transform: `scaleX(${left / DISTRACTOR_SECONDS})` }} />
      </div>
      <p className={`serif mem-sum ${flash ? `is-${flash}` : ""}`} aria-live="polite">
        {problem.text} = ?
      </p>
      <div className="mem-options">
        {problem.options.map((o, i) => (
          <button key={`${problem.text}-${o}`} className="mem-btn mem-btn--option" onClick={() => answer(o)}>
            <kbd>{i + 1}</kbd> {o}
          </button>
        ))}
      </div>
      <p className="mem-hint">
        {score.right} correct · {left}s left
      </p>
    </section>
  );
}

// ── Test ────────────────────────────────────────────────────────────────────

function TestIntro({ count, onStart }: { count: number; onStart: () => void }) {
  return (
    <section className="mem-stage mem-intro mem-enter">
      <p className="mem-kicker">The test</p>
      <h2 className="serif mem-h2">Did you see it?</h2>
      <p className="mem-lede">
        You&rsquo;ll see {count} words, one at a time. Some were in the lists, some weren&rsquo;t. For each one, say whether you
        saw it, then how sure you are. Go with your gut.
      </p>
      <ul className="mem-keys">
        <li>
          <kbd>Y</kbd> or <kbd>←</kbd> I saw this
        </li>
        <li>
          <kbd>N</kbd> or <kbd>→</kbd> I did not see this
        </li>
        <li>
          <kbd>1</kbd>–<kbd>5</kbd> how sure you are
        </li>
      </ul>
      <button className="mem-btn mem-btn--primary" onClick={onStart} autoFocus>
        Start the test
      </button>
    </section>
  );
}

const CONF_LABELS = ["Guessing", "Unsure", "Fairly sure", "Sure", "Certain"];

function Test({ items, onDone }: { items: TestItem[]; onDone: (r: TestResponse[]) => void }) {
  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState<{ saidSeen: boolean; rtMs: number } | null>(null);
  const shownAt = useRef(0);
  const confRef = useRef<HTMLDivElement>(null);
  const acc = useRef<TestResponse[]>([]);
  const item = items[idx];

  useEffect(() => {
    shownAt.current = performance.now();
  }, [idx]);

  // Move focus to the confidence group (not to a specific rating — that would bias answers).
  useEffect(() => {
    if (choice) confRef.current?.focus();
  }, [choice]);

  const choose = useCallback(
    (saidSeen: boolean) => {
      if (choice) return;
      setChoice({ saidSeen, rtMs: Math.round(performance.now() - shownAt.current) });
    },
    [choice]
  );

  const rate = useCallback(
    (confidence: number) => {
      if (!choice) return;
      acc.current = [...acc.current, { word: item.word, saidSeen: choice.saidSeen, confidence, rtMs: choice.rtMs }];
      setChoice(null);
      if (idx + 1 < items.length) setIdx(idx + 1);
      else onDone(acc.current);
    },
    [choice, item, idx, items.length, onDone]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (!choice) {
        if (k === "y" || k === "arrowleft") {
          e.preventDefault();
          choose(true);
        } else if (k === "n" || k === "arrowright") {
          e.preventDefault();
          choose(false);
        }
      } else {
        const n = Number(k);
        if (n >= 1 && n <= 5) rate(n);
        else if (k === "escape" || k === "backspace") setChoice(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choice, choose, rate]);

  return (
    <section className="mem-stage mem-test" aria-label="Recognition test">
      <div className="mem-study-top">
        <span>
          Word {idx + 1} of {items.length}
        </span>
        <span className="mem-progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${idx / items.length})` }} />
        </span>
      </div>

      <div className="mem-word-wrap">
        <p key={item.word} className="serif mem-word mem-word--test" aria-live="polite">
          {item.word}
        </p>
      </div>

      {!choice ? (
        <div className="mem-choice" key={`c-${idx}`}>
          <button className="mem-btn mem-btn--yes" onClick={() => choose(true)}>
            I saw this <kbd>Y</kbd>
          </button>
          <button className="mem-btn mem-btn--no" onClick={() => choose(false)}>
            I did not see this <kbd>N</kbd>
          </button>
        </div>
      ) : (
        <div className="mem-confidence" key={`r-${idx}`} role="group" aria-label="How sure are you?" tabIndex={-1} ref={confRef}>
          <p className="mem-conf-q">
            {choice.saidSeen ? "You saw it." : "You didn’t see it."} How sure are you?
          </p>
          <div className="mem-conf-row">
            {CONF_LABELS.map((label, i) => (
              <button key={label} className="mem-btn mem-btn--conf" onClick={() => rate(i + 1)}>
                <strong>{i + 1}</strong>
                <small>{label}</small>
              </button>
            ))}
          </div>
          <button className="mem-link" onClick={() => setChoice(null)}>
            ← change answer
          </button>
        </div>
      )}
    </section>
  );
}

