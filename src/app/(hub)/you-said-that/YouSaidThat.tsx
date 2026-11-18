"use client";

import { useEffect, useState } from "react";
import { newSeed, SEED_RE } from "@/lib/you-said-that/rng";
import { TRIALS } from "@/lib/you-said-that/protocol";
import Trial from "./Trial";
import type { TrialLog } from "./types";

type Phase = { k: "intro" } | { k: "p1"; i: number } | { k: "p1done" };

export default function YouSaidThat() {
  const [seed, setSeed] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);
  const [phase, setPhase] = useState<Phase>({ k: "intro" });
  const [trials, setTrials] = useState<TrialLog[]>([]);
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase.k]);

  const start = () => {
    // ?s= lets a friend get the same pieces (the link carries no result, so it spoils nothing)
    const s = new URLSearchParams(window.location.search).get("s");
    setSeed(s && SEED_RE.test(s) ? s : newSeed());
    setDevice(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700 ? "mobile" : "desktop");
    setTrials([]);
    setPhase({ k: "p1", i: 0 });
  };

  if (phase.k === "intro" || !seed)
    return (
      <section className="yst-stage yst-enter">
        <p className="yst-kicker">A taste test</p>
        <h1 className="serif yst-title">You Said That?</h1>
        <p className="yst-lede">A quick taste test: pick the one you prefer, then tell us why.</p>
        <p className="yst-dim">Two short parts, about five minutes. Anything you type stays on your device.</p>
        <button className="yst-btn yst-btn--primary" onClick={start} autoFocus>
          Start
        </button>
      </section>
    );

  if (phase.k === "p1")
    return (
      <Trial
        key={phase.i}
        seed={seed}
        index={phase.i}
        reduced={reduced}
        onDone={(log) => {
          setTrials((xs) => [...xs.slice(0, phase.i), log]);
          setPhase(phase.i + 1 < TRIALS ? { k: "p1", i: phase.i + 1 } : { k: "p1done" });
        }}
      />
    );

  return (
    <section className="yst-stage yst-enter">
      <p className="yst-kicker">Part 1 done</p>
      <h1 className="serif yst-h1">Thanks. {trials.length} choices made.</h1>
    </section>
  );
}
