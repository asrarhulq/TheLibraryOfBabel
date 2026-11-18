"use client";

import { useEffect, useState } from "react";
import { newSeed, SEED_RE } from "@/lib/you-said-that/rng";
import { scoreRun, TRIALS, type RunInput } from "@/lib/you-said-that/protocol";
import ChooseAgain from "./ChooseAgain";
import HowItWorks from "./HowItWorks";
import Reveal from "./Reveal";
import Trial from "./Trial";
import Values from "./Values";
import type { Part2Log, ServerResult, TrialLog } from "./types";

type Phase = { k: "intro" } | { k: "p1"; i: number } | { k: "p2" } | { k: "reveal" };

export default function YouSaidThat() {
  const [seed, setSeed] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);
  const [phase, setPhase] = useState<Phase>({ k: "intro" });
  const [trials, setTrials] = useState<TrialLog[]>([]);
  const [part2, setPart2] = useState<Part2Log | null>(null);
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop");
  const [server, setServer] = useState<ServerResult | null>(null);

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

  const start = (fresh = false) => {
    // ?s= lets a friend get the same pieces (the link carries no result, so it spoils nothing)
    const s = fresh ? null : new URLSearchParams(window.location.search).get("s");
    if (fresh && window.location.search) window.history.replaceState(null, "", window.location.pathname);
    setSeed(s && SEED_RE.test(s) ? s : newSeed());
    setDevice(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700 ? "mobile" : "desktop");
    setTrials([]);
    setPart2(null);
    setServer(null);
    setPhase({ k: "p1", i: 0 });
  };

  /**
   * Sends choices only. The body is built field by field from the logs, so nothing typed (chips or
   * text) can end up in it; the server recomputes every outcome from the seed.
   */
  async function submit(p2: Part2Log) {
    const body: RunInput = {
      seed: seed!,
      reducedMotion: reduced,
      device,
      picks: trials.map((t) => t.picked),
      flagged: trials.map((t) => t.flagged),
      rtMs: trials.map((t) => Math.min(600_000, Math.max(0, Math.round(t.rtMs)))),
      values: p2.values,
      flaggedStatements: p2.flagged,
      strongest: p2.strongest,
    };
    const local = (): ServerResult => ({ id: null, deleteToken: null, ...scoreRun(body) });
    try {
      const r = await fetch("/api/you-said-that/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => null);
      setServer(j && j.totals ? { id: j.id ?? null, deleteToken: j.deleteToken ?? null, totals: j.totals, trials: j.trials, statements: j.statements, reversed: j.reversed } : local());
    } catch {
      setServer(local());
    }
  }

  if (phase.k === "intro" || !seed)
    return (
      <section className="yst-stage yst-enter">
        <p className="yst-kicker">Decision research</p>
        <h1 className="serif yst-title">You Said That?</h1>
        <p className="yst-lede">A quick taste test: pick the one you prefer, then tell us why.</p>
        <p className="yst-dim">Two short parts, about five minutes. Anything you type stays on your device.</p>
        <button className="yst-btn yst-btn--primary" onClick={() => start()} autoFocus>
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
          setPhase(phase.i + 1 < TRIALS ? { k: "p1", i: phase.i + 1 } : { k: "p2" });
        }}
      />
    );

  if (phase.k === "p2")
    return (
      <Values
        seed={seed}
        reduced={reduced}
        onDone={(log) => {
          setPart2(log);
          setPhase({ k: "reveal" });
          submit(log);
        }}
      />
    );

  return (
    <Reveal seed={seed} trials={trials} part2={part2!} server={server} reduced={reduced} onAgain={() => start(true)}>
      <ChooseAgain seed={seed} trials={trials} />
      <HowItWorks seed={seed} trials={trials} reduced={reduced} />
    </Reveal>
  );
}
