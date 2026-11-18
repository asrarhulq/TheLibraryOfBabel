"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildScene, choicesFor, type ChoiceId } from "@/lib/missed/engine";
import Arena, { type Program } from "./Arena";
import Reveal from "./Reveal";
import ReadInstead from "./ReadInstead";

type Phase =
  | "intro"
  | "read"
  | "r1-brief"
  | "r1-play"
  | "r1-count"
  | "r1-result"
  | "r2-brief"
  | "r2-play"
  | "r2-count"
  | "r2-noticed"
  | "r2-what"
  | "r2-conf"
  | "r3-brief"
  | "r3-play"
  | "r3-noticed"
  | "r3-what"
  | "saving"
  | "reveal";

export interface Answers {
  practiceAnswer: number;
  countAnswer: number;
  noticed: boolean;
  choice: ChoiceId | null;
  confidence: number | null;
  r3Noticed: boolean;
  r3Choice: ChoiceId | null;
}

export interface ServerResult {
  id: string | null;
  correctCount: number;
  practiceCorrect: number;
  identified: boolean;
  r3Identified: boolean;
}

const PLAY: Program = { type: "play" };

function newSeed() {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  const b = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(b, (x) => a[x % 36]).join("");
}

export default function Missed() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [seed, setSeed] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);
  const [a, setA] = useState<Answers>({ practiceAnswer: 0, countAnswer: 0, noticed: false, choice: null, confidence: null, r3Noticed: false, r3Choice: null });
  const [server, setServer] = useState<ServerResult | null>(null);
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop");

  const practice = useMemo(() => (seed ? buildScene(seed, "practice", reduced) : null), [seed, reduced]);
  const critical = useMemo(() => (seed ? buildScene(seed, "critical", reduced) : null), [seed, reduced]);
  const choices = useMemo(() => (seed ? choicesFor(seed) : []), [seed]);

  const start = () => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(rm);
    setDevice(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700 ? "mobile" : "desktop");
    setSeed(newSeed());
    setA({ practiceAnswer: 0, countAnswer: 0, noticed: false, choice: null, confidence: null, r3Noticed: false, r3Choice: null });
    setServer(null);
    setPhase("r1-brief");
  };

  async function submit(final: Answers) {
    setPhase("saving");
    const body = { seed, reducedMotion: reduced, device, ...final };
    let res: ServerResult = {
      id: null,
      correctCount: critical!.bounceCount,
      practiceCorrect: practice!.bounceCount,
      identified: final.noticed && final.choice === "star",
      r3Identified: final.r3Noticed && final.r3Choice === "star",
    };
    try {
      const r = await fetch("/api/missed/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (r.ok) res = j;
    } catch {
      /* the reveal works without saving */
    }
    setServer(res);
    setPhase("reveal");
    window.scrollTo({ top: 0 });
  }

  if (phase === "intro") return <Intro onStart={start} onRead={() => setPhase("read")} />;
  if (phase === "read") return <ReadInstead onBack={() => setPhase("intro")} />;
  if (!seed || !practice || !critical) return null;

  const task = (
    <p className="ms-task">
      Count how many times the <span className="ms-chip ms-chip--white" aria-hidden="true" /> <strong>WHITE</strong> circles bounce off
      the walls. Ignore the <span className="ms-chip ms-chip--dark" aria-hidden="true" /> dark ones.
    </p>
  );

  switch (phase) {
    case "r1-brief":
      return (
        <Brief step="Round 1 of 3 · practice" title="Count the bounces" onGo={() => setPhase("r1-play")} cta="Start round 1">
          {task}
          <p className="ms-dim">A wall bounce is when a white circle touches an edge and turns back. Corners count once.</p>
        </Brief>
      );
    case "r1-play":
      return <Play scene={practice} program={PLAY} label="Round 1: count white bounces" head="Count WHITE bounces" onEnd={() => setPhase("r1-count")} />;
    case "r1-count":
      return (
        <CountAsk
          title="How many white bounces?"
          onSubmit={(n) => {
            setA((x) => ({ ...x, practiceAnswer: n }));
            setPhase("r1-result");
          }}
        />
      );
    case "r1-result": {
      const diff = a.practiceAnswer - practice.bounceCount;
      return (
        <Brief
          step="Round 1 result"
          title={diff === 0 ? "Exactly right." : Math.abs(diff) <= 1 ? "Very close." : "Not quite."}
          onGo={() => setPhase("r2-brief")}
          cta="Next round"
        >
          <p className="ms-big">
            You counted <strong>{a.practiceAnswer}</strong>. The answer was <strong>{practice.bounceCount}</strong>.
          </p>
          <p className="ms-dim">The answer is counted from the motion itself, frame by frame.</p>
        </Brief>
      );
    }
    case "r2-brief":
      return (
        <Brief step="Round 2 of 3" title="Faster this time" onGo={() => setPhase("r2-play")} cta="Start round 2">
          {task}
          <p className="ms-dim">Same task, with more bounces.</p>
        </Brief>
      );
    case "r2-play":
      return <Play scene={critical} program={PLAY} label="Round 2: count white bounces" head="Count WHITE bounces" onEnd={() => setPhase("r2-count")} />;
    case "r2-count":
      return (
        <CountAsk
          title="How many white bounces?"
          onSubmit={(n) => {
            setA((x) => ({ ...x, countAnswer: n }));
            setPhase("r2-noticed");
          }}
        />
      );
    case "r2-noticed":
      return (
        <YesNo
          title="Did you notice anything unusual?"
          onAnswer={(yes) => {
            setA((x) => ({ ...x, noticed: yes, choice: null, confidence: null }));
            setPhase(yes ? "r2-what" : "r3-brief");
          }}
        />
      );
    case "r2-what":
      return (
        <Choose
          title="What was it?"
          choices={choices}
          onPick={(c) => {
            setA((x) => ({ ...x, choice: c }));
            setPhase("r2-conf");
          }}
        />
      );
    case "r2-conf":
      return (
        <Confidence
          onPick={(n) => {
            setA((x) => ({ ...x, confidence: n }));
            setPhase("r3-brief");
          }}
        />
      );
    case "r3-brief":
      return (
        <Brief step="Round 3 of 3" title="No counting this time" onGo={() => setPhase("r3-play")} cta="Start round 3">
          <p className="ms-task">Just watch.</p>
        </Brief>
      );
    case "r3-play":
      return <Play scene={critical} program={PLAY} label="Round 3: just watch" head="Just watch" onEnd={() => setPhase("r3-noticed")} />;
    case "r3-noticed":
      return (
        <YesNo
          title="Did you notice anything unusual this time?"
          onAnswer={(yes) => {
            if (yes) {
              setA((x) => ({ ...x, r3Noticed: true }));
              setPhase("r3-what");
            } else submit({ ...a, r3Noticed: false, r3Choice: null });
          }}
        />
      );
    case "r3-what":
      return <Choose title="What was it?" choices={choices} onPick={(c) => submit({ ...a, r3Noticed: true, r3Choice: c })} />;
    case "saving":
      return <div className="ms-stage" aria-busy="true" />;
    case "reveal":
      return <Reveal scene={critical} answers={a} server={server!} reduced={reduced} onAgain={start} />;
  }
}

// ── Pieces ──────────────────────────────────────────────────────────────────

function Intro({ onStart, onRead }: { onStart: () => void; onRead: () => void }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduced(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  return (
    <section className="ms-stage ms-intro ms-enter">
      <p className="ms-kicker">Attention research</p>
      <h1 className="serif ms-title">The Thing You Missed</h1>
      <p className="ms-lede">A short counting task, about 90 seconds in all.</p>
      <button className="ms-btn ms-btn--primary" onClick={onStart} autoFocus>
        Start
      </button>
      {reduced ? (
        <p className="ms-dim ms-rm">
          Reduced motion is on, so the shapes will move more slowly.{" "}
          <button className="ms-link" onClick={onRead}>
            Prefer a plain explanation without animation?
          </button>
        </p>
      ) : (
        <button className="ms-link ms-rm" onClick={onRead}>
          Can&rsquo;t watch animation? Read a plain explanation instead.
        </button>
      )}
    </section>
  );
}

function Brief({ step, title, children, onGo, cta }: { step: string; title: string; children: React.ReactNode; onGo: () => void; cta: string }) {
  return (
    <section className="ms-stage ms-enter">
      <p className="ms-kicker">{step}</p>
      <h2 className="serif ms-h2">{title}</h2>
      <div className="ms-brief">{children}</div>
      <button className="ms-btn ms-btn--primary" onClick={onGo} autoFocus>
        {cta}
      </button>
    </section>
  );
}

function Play({ scene, program, label, head, onEnd }: { scene: ReturnType<typeof buildScene>; program: Program; label: string; head: string; onEnd: () => void }) {
  const barRef = useRef<HTMLSpanElement>(null);
  const duration = scene.frames / 60;
  return (
    <section className="ms-stage ms-play">
      <p className="ms-playhead">{head}</p>
      <div className="ms-arena-wrap">
        <Arena
          scene={scene}
          program={program}
          label={label}
          onEnd={onEnd}
          onTime={(t) => {
            if (barRef.current) barRef.current.style.transform = `scaleX(${t / duration})`;
          }}
        />
      </div>
      <span className="ms-progress" aria-hidden="true">
        <span ref={barRef} />
      </span>
    </section>
  );
}

function CountAsk({ title, onSubmit }: { title: string; onSubmit: (n: number) => void }) {
  const [n, setN] = useState(0);
  const clamp = (v: number) => Math.max(0, Math.min(99, v));
  return (
    <section className="ms-stage ms-enter">
      <h2 className="serif ms-h2">{title}</h2>
      <form
        className="ms-count"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(n);
        }}
      >
        <button type="button" className="ms-step" aria-label="One fewer" onClick={() => setN((v) => clamp(v - 1))}>
          −
        </button>
        <input
          className="serif"
          inputMode="numeric"
          aria-label="Your count"
          value={n}
          autoFocus
          onFocus={(e) => e.target.select()}
          onChange={(e) => setN(clamp(Number(e.target.value.replace(/\D/g, "").slice(0, 2)) || 0))}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              const d = e.key === "ArrowUp" ? 1 : -1;
              setN((v) => clamp(v + d));
            }
          }}
        />
        <button type="button" className="ms-step" aria-label="One more" onClick={() => setN((v) => clamp(v + 1))}>
          +
        </button>
        <button className="ms-btn ms-btn--primary ms-count-go" type="submit">
          That&rsquo;s my count
        </button>
      </form>
      <p className="ms-dim">Type a number, or use − / + (arrow keys work too).</p>
    </section>
  );
}

function useKeys(map: Record<string, () => void>) {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const f = ref.current[e.key.toLowerCase()];
      if (f) {
        e.preventDefault();
        f();
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
}

function YesNo({ title, onAnswer }: { title: string; onAnswer: (yes: boolean) => void }) {
  useKeys({ y: () => onAnswer(true), n: () => onAnswer(false) });
  return (
    <section className="ms-stage ms-enter">
      <h2 className="serif ms-h2">{title}</h2>
      <div className="ms-answers ms-answers--two">
        <button className="ms-btn ms-answer" onClick={() => onAnswer(true)}>
          Yes <kbd>Y</kbd>
        </button>
        <button className="ms-btn ms-answer" onClick={() => onAnswer(false)}>
          No <kbd>N</kbd>
        </button>
      </div>
    </section>
  );
}

function Choose({ title, choices, onPick }: { title: string; choices: { id: ChoiceId; label: string }[]; onPick: (c: ChoiceId) => void }) {
  useKeys(Object.fromEntries(choices.map((c, i) => [String(i + 1), () => onPick(c.id)])));
  return (
    <section className="ms-stage ms-enter">
      <h2 className="serif ms-h2">{title}</h2>
      <div className="ms-answers">
        {choices.map((c, i) => (
          <button key={c.id} className="ms-btn ms-answer" onClick={() => onPick(c.id)}>
            <kbd>{i + 1}</kbd> {c.label}
          </button>
        ))}
      </div>
    </section>
  );
}

const CONF = ["Guessing", "Unsure", "Fairly sure", "Sure", "Certain"];
function Confidence({ onPick }: { onPick: (n: number) => void }) {
  useKeys(Object.fromEntries(CONF.map((_, i) => [String(i + 1), () => onPick(i + 1)])));
  return (
    <section className="ms-stage ms-enter">
      <h2 className="serif ms-h2">How sure are you?</h2>
      <div className="ms-conf">
        {CONF.map((l, i) => (
          <button key={l} className="ms-btn ms-conf-btn" onClick={() => onPick(i + 1)}>
            <strong>{i + 1}</strong>
            <small>{l}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
