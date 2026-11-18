"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Scene } from "@/lib/missed/engine";
import { MOST2001, SC1999 } from "@/lib/missed/research";
import Arena, { type Program } from "./Arena";
import Sandbox from "./Sandbox";
import Share from "./Share";
import Debrief from "./Debrief";
import type { Answers, ServerResult } from "./Missed";

const REWIND: Program = { type: "rewind" };
const SPOT: Program = { type: "play", spotlight: true, from: 9 }; // star arrives at 12 s

interface Stats {
  runs: number;
  identifiedPct: number;
  r3IdentifiedPct: number;
}

export default function Reveal({
  scene,
  answers,
  server,
  reduced,
  onAgain,
}: {
  scene: Scene;
  answers: Answers;
  server: ServerResult;
  reduced: boolean;
  onAgain: () => void;
}) {
  const missed = !server.identified;
  const [rewound, setRewound] = useState(!missed);
  const [stats, setStats] = useState<Stats | null>(null);
  const [spotKey, setSpotKey] = useState(0);
  const seconds = Math.round(scene.star!.visibleSeconds);
  const diff = answers.countAnswer - server.correctCount;

  useEffect(() => {
    fetch("/api/missed/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setStats(s))
      .catch(() => {});
  }, []);

  return (
    <div className="ms-reveal">
      <section className="ms-stage ms-reveal-top">
        {missed ? (
          <>
            <p className="ms-kicker">Round 2 again · inattentional blindness</p>
            <div className="ms-arena-wrap">
              <Arena scene={scene} program={REWIND} label="Round 2 rewinding to a magenta star crossing the middle" onEnd={() => setRewound(true)} />
            </div>
            <div className={`ms-reveal-msg ${rewound ? "is-on" : ""}`} aria-live="polite">
              {rewound && (
                <>
                  <h1 className="serif ms-h1">
                    This crossed the middle of the screen.
                    <br />
                    It was visible for about {seconds} seconds.
                  </h1>
                  <p className="ms-lede">
                    {answers.noticed
                      ? "You noticed something, but not the magenta star. "
                      : "A magenta star, three times the size of the circles, crossed the whole arena. "}
                    In the original study, {SC1999.missedPct}% of people missed the unexpected event.
                  </p>
                  {server.r3Identified && <p className="ms-dim">In round 3, when you weren&rsquo;t counting, you saw it.</p>}
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="ms-kicker">You spotted it · inattentional blindness</p>
            <h1 className="serif ms-h1">You saw the magenta star.</h1>
            <p className="ms-lede">
              Plenty of people do, but not all: in the original study, {SC1999.missedPct}% missed it.
            </p>
          </>
        )}

        <div className="ms-score">
          <div>
            <span className="serif">{answers.countAnswer}</span>
            <small>you counted</small>
          </div>
          <div>
            <span className="serif">{server.correctCount}</span>
            <small>actual bounces</small>
          </div>
          <div>
            <span className="serif">{diff === 0 ? "✓" : diff > 0 ? `+${diff}` : diff}</span>
            <small>{diff === 0 ? "exactly right" : "off by"}</small>
          </div>
        </div>
        {!missed && (
          <p className="ms-dim ms-narrow">
            Noticing can cost something: in one study, people who noticed the surprise counted less accurately on that round than
            on the round before ({MOST2001.cite.split(",")[0]} et al., 2001).
          </p>
        )}
      </section>

      {rewound && (
        <>
          <section className="ms-sec">
            <h2 className="serif ms-h2">Where attention goes</h2>
            <p className="ms-lede ms-narrow">
              While you count, your attention stays on the white circles. Other things, even big bright ones, can go unnoticed.
            </p>
            <div className="ms-arena-wrap ms-arena-wrap--sm">
              <Arena key={spotKey} scene={scene} program={SPOT} label="Illustration: pools of light on the white circles while the star crosses in the dark" />
            </div>
            <p className="ms-caption">
              <strong>Illustration of the idea, not a recording of where you looked.</strong> Research suggests attention follows
              the objects you&rsquo;re tracking more than a fixed spot on the screen ({SC1999.cite}).{" "}
              <button className="ms-link" onClick={() => setSpotKey((k) => k + 1)}>
                Replay
              </button>
            </p>
          </section>

          <section className="ms-sec ms-research">
            <h2 className="serif ms-h2">The research</h2>
            <div className="ms-facts">
              <figure>
                <span className="serif">{SC1999.missedPct}%</span>
                <figcaption>
                  of {SC1999.observers} people counting passes in a video missed an unexpected person walking through it.
                  <cite>
                    <a href={SC1999.url} target="_blank" rel="noreferrer">
                      {SC1999.cite}
                    </a>
                  </cite>
                </figcaption>
              </figure>
              <figure>
                <span className="serif">{100 - MOST2001.uniqueCrossNoticedPct}%</span>
                <figcaption>
                  of people counting moving shapes missed a bright red cross that crossed the screen for {MOST2001.uniqueCrossSeconds}{" "}
                  seconds.
                  <cite>
                    <a href={MOST2001.url} target="_blank" rel="noreferrer">
                      {MOST2001.cite}, Exp. 3
                    </a>
                  </cite>
                </figcaption>
              </figure>
              {stats && stats.runs >= 20 && (
                <figure>
                  <span className="serif">{Math.round(100 - stats.identifiedPct)}%</span>
                  <figcaption>
                    of {stats.runs.toLocaleString()} people here missed the star while counting.{" "}
                    {Math.round(stats.r3IdentifiedPct)}% saw it when just watching.
                    <cite>This site, anonymous results</cite>
                  </figcaption>
                </figure>
              )}
            </div>
            <div className="ms-explain">
              <p>
                Your eyes take in the whole scene, but you only become aware of the part your attention is on. Counting takes up
                most of that attention, so something big and unexpected can cross the middle of the screen without you noticing it.
                Psychologists call this <strong>inattentional blindness</strong>.
              </p>
              <p>
                Missing it doesn&rsquo;t mean you weren&rsquo;t paying attention. You were, to the circles. Being able to focus on one
                thing means other things get filtered out.
              </p>
            </div>
          </section>

          <Sandbox />
          {server.id && <Share id={server.id} answers={answers} server={server} seconds={seconds} />}

          <div className="ms-again">
            <button className="ms-btn ms-btn--primary" onClick={onAgain}>
              Try again with a new scene
            </button>
            <Link className="ms-btn" href="/">
              Back to the library
            </Link>
          </div>
          <Debrief reduced={reduced} />
        </>
      )}
    </div>
  );
}
