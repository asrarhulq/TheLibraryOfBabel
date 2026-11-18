"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildReplay } from "@/lib/you-said-that/replay";
import { H2012, J2005, NW1977 } from "@/lib/you-said-that/research";
import Debrief from "./Debrief";
import Replay from "./Replay";
import Ring, { type Seg } from "./Ring";
import type { Part2Log, ServerResult, TrialLog } from "./types";

interface Stats {
  runs: number;
  detectedPct: number;
  defendedAnyPct: number;
}

export default function Reveal({
  seed,
  trials,
  part2,
  server,
  reduced,
  onAgain,
  children,
}: {
  seed: string;
  trials: TrialLog[];
  part2: Part2Log;
  server: ServerResult | null;
  reduced: boolean;
  onAgain: () => void;
  children?: React.ReactNode;
}) {
  const [stage, setStage] = useState<{ k: "dim" } | { k: "replay"; n: number } | { k: "result" }>({ k: "dim" });
  const [stats, setStats] = useState<Stats | null>(null);
  const [del, setDel] = useState<"idle" | "confirm" | "busy" | "done" | "error">("idle");
  const heading = useRef<HTMLHeadingElement>(null);

  const replay = useMemo(() => buildReplay(seed, trials, part2), [seed, trials, part2]);

  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0 });
  }, [stage.k]);

  useEffect(() => {
    fetch("/api/you-said-that/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setStats(s))
      .catch(() => {});
  }, []);

  // Outcomes come from the server's recomputation (or the same function locally if saving failed).
  const segs: Seg[] = server
    ? replay.items.map((it) => {
        const o = it.kind === "pick" ? server.trials[it.index] : server.statements[it.index];
        return o.detected ? "noticed" : o.defended ? "defended" : "passed";
      })
    : [];
  const t = server?.totals;

  const deleteRun = async () => {
    if (!server?.id || !server.deleteToken) return;
    setDel("busy");
    try {
      const r = await fetch(`/api/you-said-that/run/${server.id}`, { method: "DELETE", headers: { "x-delete-token": server.deleteToken } });
      setDel(r.ok ? "done" : "error");
    } catch {
      setDel("error");
    }
  };

  if (stage.k === "dim")
    return (
      <section className="yst-dimroom" aria-labelledby="yst-dim-h">
        <div className="yst-dimroom-inner yst-enter">
          <h1 id="yst-dim-h" className="serif yst-h1" ref={heading} tabIndex={-1}>
            Something happened during this test.
            <br />
            Let&rsquo;s replay it.
          </h1>
          <p className="yst-dimroom-note">
            The swaps were part of the design. On three pairs we handed back the piece you <em>didn&rsquo;t</em> pick, and on two
            statements the summary showed the opposite of your answer. Nothing was wrong with your screen, and nothing you typed was
            sent anywhere.
          </p>
          <button className="yst-btn yst-btn--primary" onClick={() => setStage({ k: "replay", n: 0 })} autoFocus>
            Replay
          </button>
          <button className="yst-link" onClick={() => setStage({ k: "result" })}>
            Skip to my result
          </button>
        </div>
      </section>
    );

  if (stage.k === "replay") {
    const it = replay.items[stage.n];
    const wrote = it.kind === "pick" ? { chips: trials[it.index].chips, text: trials[it.index].text } : { text: part2.texts[it.index] };
    return (
      <section className="yst-dimroom yst-dimroom--replay">
        <h1 className="visually-hidden" ref={heading} tabIndex={-1}>
          Replay
        </h1>
        <Replay
          key={stage.n}
          item={it}
          step={stage.n}
          total={replay.items.length}
          reduced={reduced}
          wrote={wrote}
          onNext={() => setStage(stage.n + 1 < replay.items.length ? { k: "replay", n: stage.n + 1 } : { k: "result" })}
        />
      </section>
    );
  }

  return (
    <div className="yst-result">
      <section className="yst-stage yst-result-top">
        <p className="yst-kicker">Your result</p>
        {!t ? (
          <p className="yst-lede" aria-busy="true">
            Working it out…
          </p>
        ) : (
          <>
            <Ring segs={segs} reduced={reduced} />
            <h1 className="serif yst-h1 yst-result-h" ref={heading} tabIndex={-1}>
              You were shown a swapped choice {t.manipulated} times.
              <br />
              You noticed {t.detected}. You defended {t.defended}.
            </h1>
            {t.accepted > 0 && (
              <p className="yst-dim">
                {t.accepted === 1 ? "One more" : `${t.accepted} more`} slipped by unflagged without you choosing to explain {t.accepted === 1 ? "it" : "them"}.
              </p>
            )}
            <div className="yst-msg">
              {t.defended > 0 ? (
                <>
                  <p>
                    <strong>This is normal.</strong>{" "}Asked &ldquo;why?&rdquo;, the mind readily supplies reasons, even for a choice it
                    never made. In the original face study most swaps went unnoticed, and explanations for swapped choices were rated
                    just as confident, detailed and emotional as explanations for real ones.
                  </p>
                  <p>It says something real about how explanations are built: often after the fact, from whatever is in front of us.</p>
                </>
              ) : t.detected === t.manipulated ? (
                <>
                  <p>
                    <strong>You caught every swap.</strong>{" "}Well spotted. Catching it is common on some trials (a big, obvious difference,
                    or an answer you hold strongly) and much rarer on others: in the face study, no more than {J2005.totalExposedMaxPct}%
                    of swaps were exposed by any measure.
                  </p>
                </>
              ) : (
                <p>
                  <strong>You didn&rsquo;t defend a swapped choice</strong>, but not every swap was flagged. Noticing tends to depend on
                  how big the change is and how strongly you hold the view: some swaps get caught, others pass quietly.
                </p>
              )}
              {t.falseAlarms > 0 && (
                <p className="yst-dim">
                  You also flagged {t.falseAlarms} {t.falseAlarms === 1 ? "card that wasn't" : "cards that weren't"} swapped. Once you
                  start suspecting, everything looks suspicious, which researchers see too.
                </p>
              )}
            </div>
            {!replay.consistent && (
              <p className="yst-dim" role="alert">
                Something about this run&rsquo;s log looks inconsistent; the counts above come from the server&rsquo;s recomputation.
              </p>
            )}
          </>
        )}
      </section>

      <section className="yst-sec yst-yourrun" aria-labelledby="yst-run-h">
        <h2 id="yst-run-h" className="serif yst-h3">
          About your run
        </h2>
        <p>
          The swaps were deliberate: pairs 4, 7 and 9, and two of your statement answers. We stored only what happened (which cards were
          swapped, whether you flagged them, how long you took), never anything you typed and not your slider answers.
        </p>
        {server?.id ? (
          del === "done" ? (
            <p role="status">Your run has been deleted.</p>
          ) : del === "confirm" || del === "busy" ? (
            <p className="yst-del">
              Delete this run for good?{" "}
              <button className="yst-btn yst-btn--danger" onClick={deleteRun} disabled={del === "busy"}>
                Yes, delete it
              </button>{" "}
              <button className="yst-link" onClick={() => setDel("idle")}>
                Cancel
              </button>
            </p>
          ) : (
            <p>
              <button className="yst-btn yst-btn--danger" onClick={() => setDel("confirm")}>
                Delete my run
              </button>
              {del === "error" && <span role="alert"> Couldn&rsquo;t delete right now. Please try again.</span>}
            </p>
          )
        ) : (
          server && <p className="yst-dim">This run wasn&rsquo;t saved (the server was unavailable), so there is nothing to delete.</p>
        )}
      </section>

      <section className="yst-sec">
        <h2 className="serif yst-h2">You&rsquo;re not alone</h2>
        <div className="yst-facts">
          <figure>
            <span className="serif">{J2005.concurrentPct}%</span>
            <figcaption>
              of {J2005.mTrials} swapped trials were noticed at the time, when {J2005.participants} people chose the more attractive of two
              faces and were handed the other one. Counting every form of detection, even afterwards, no more than{" "}
              {J2005.totalExposedMaxPct}%.
              <cite>
                <a href={J2005.url} target="_blank" rel="noreferrer">
                  {J2005.cite}
                </a>
              </cite>
            </figcaption>
          </figure>
          <figure>
            <span className="serif">{J2005.thoughtTheyWouldNoticePct}%</span>
            <figcaption>
              of the people who missed every swap in that study believed they would have noticed such a change.
              <cite>
                <a href={J2005.url} target="_blank" rel="noreferrer">
                  {J2005.short}, supporting online material
                </a>
              </cite>
            </figcaption>
          </figure>
          <figure>
            <span className="serif">{H2012.failedAtLeastOnePct}%</span>
            <figcaption>
              of {H2012.participants} people failed to detect at least one of two reversed moral statements on a survey, and{" "}
              {H2012.arguedOppositePct}% argued for the opposite of their original view at least once.
              <cite>
                <a href={H2012.url} target="_blank" rel="noreferrer">
                  {H2012.cite}
                </a>
              </cite>
            </figcaption>
          </figure>
          {stats && stats.runs >= 20 && (
            <figure>
              <span className="serif">{Math.round(stats.detectedPct)}%</span>
              <figcaption>
                of swaps were flagged by the {stats.runs.toLocaleString()} people who took this test here.{" "}
                {Math.round(stats.defendedAnyPct)}% defended at least one swapped choice.
                <cite>This site, anonymous results</cite>
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      <section className="yst-sec">
        <h2 className="serif yst-h2">Why it happens</h2>
        <div className="yst-explain-text">
          <p>
            <strong>We don&rsquo;t have a window onto our own reasons.</strong>{" "}When asked why we chose something, we rarely replay the
            decision. We look at the result and infer a plausible reason, the same way we would explain someone else&rsquo;s choice. When
            the result has been swapped, the inference runs just as smoothly. This idea is associated with{" "}
            <a href={NW1977.url} target="_blank" rel="noreferrer">
              Nisbett and Wilson (1977)
            </a>
            , who argued that people often report reasons they could not have had direct access to.
          </p>
          <p>This is a question about self-knowledge, the old philosophical puzzle of how we know our own minds, not a flaw in you.</p>
        </div>
      </section>

      {children}

      <div className="yst-again">
        <button className="yst-btn yst-btn--primary" onClick={onAgain}>
          Take it again with new pieces
        </button>
        <Link className="yst-btn" href="/">
          Back to the library
        </Link>
      </div>
      <Debrief />
    </div>
  );
}
