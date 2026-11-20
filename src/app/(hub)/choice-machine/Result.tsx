"use client";

import { useState } from "react";
import { EXPERTS, replay, SIDE_NAME, type Side } from "@/lib/choice-machine/predictor";
import { coinAtLeast, coinRunAtLeast, scoreRun, shareText, strongestHabit, TOTAL } from "@/lib/choice-machine/protocol";
import { FWH2017 } from "@/lib/choice-machine/research";
import type { ChoiceMachineStats } from "@/lib/db/choiceMachineRuns";
import { commitText, sha256Hex, type Seal } from "./seal";
import Debrief from "./Debrief";

const arrow = (s: Side) => (s ? "→" : "←");
const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function Result({
  choices,
  seal,
  stats,
  onAgain,
  reduced,
}: {
  choices: Side[];
  seal: Seal;
  stats: ChoiceMachineStats | null;
  onAgain: () => void;
  reduced: boolean;
}) {
  const score = scoreRun(choices);
  const { finalWeights } = replay(choices);
  const switchPct = Math.round((score.switches / (TOTAL - 1)) * 100);
  const lefts = TOTAL - score.rights;
  const habit = strongestHabit(choices, 2) ?? strongestHabit(choices, 1);
  const ranked = [...EXPERTS].sort((a, b) => finalWeights[b.id] - finalWeights[a.id]);
  const maxW = finalWeights[ranked[0].id];
  const luck = coinAtLeast(TOTAL, score.hits);

  return (
    <div className={`cm-result ${reduced ? "is-reduced" : ""}`}>
      <section className="cm-sec cm-tally" aria-labelledby="cm-tally-h">
        <p className="cm-kicker">The reveal</p>
        <h2 id="cm-tally-h" className="serif cm-h2">
          It predicted <span className="cm-big">{score.hits}</span> of your {TOTAL} choices.
        </h2>
        <p className="cm-lede">
          The shutter on the tape is open now. The bottom row is what the machine predicted before each of your choices; gold
          columns are the ones it got right. Guessing at random, it would get about 5 or 6.
          {score.hits >= 7 && <> A coin would do this well only {pct(luck)} of the time.</>}
          {score.hits <= 5 && <> This time you were hard to read.</>}
        </p>
      </section>

      <section className="cm-sec" aria-labelledby="cm-read-h">
        <h2 id="cm-read-h" className="serif cm-h2">
          How it read you
        </h2>
        <p className="cm-lede">
          It never knew why you chose anything. It only watched the order of your lefts and rights, and looked for habits.
        </p>
        <div className="cm-tells">
          <article className="cm-tell">
            <h3>Switching</h3>
            <p className="cm-tell-num">
              {score.switches}
              <small> of 10</small>
            </p>
            <p>You changed sides {switchPct}% of the time.</p>
            <div className="cm-meter" role="img" aria-label={`You ${switchPct}%, a coin 50%, people trying to be random about ${FWH2017.peopleSwitchPct}%`}>
              <span className="cm-meter-mark is-coin" style={{ left: "50%" }} />
              <span className="cm-meter-mark is-people" style={{ left: `${FWH2017.peopleSwitchPct}%` }} />
              <span className="cm-meter-you" style={{ left: `${switchPct}%` }} />
            </div>
            <p className="cm-legend" aria-hidden="true">
              <span className="is-you">you {switchPct}%</span>
              <span className="is-coin">coin 50%</span>
              <span className="is-people">people ~{FWH2017.peopleSwitchPct}%</span>
            </p>
            <p className="cm-dim">
              A coin switches half the time. People trying to be random switch more, about {FWH2017.peopleSwitchPct}% in one
              study ({FWH2017.short}).
            </p>
          </article>
          <article className="cm-tell">
            <h3>Streaks</h3>
            <p className="cm-tell-num">
              {score.longestRun}
              <small> in a row</small>
            </p>
            <p>Your longest run on one side.</p>
            <p className="cm-dim">
              In 11 coin flips, a run of 4 or more turns up {pct(coinRunAtLeast(TOTAL, 4))}{" "}
              of the time. People tend to break
              streaks early because long runs don&rsquo;t feel random.
            </p>
          </article>
          <article className="cm-tell">
            <h3>Habit</h3>
            {habit ? (
              <>
                <p className="cm-tell-num cm-tell-seq">
                  {habit.ctx.map(arrow).join(" ")} <span className="cm-tell-then">then</span> {arrow(habit.next)}
                </p>
                <p>
                  After {habit.ctx.map((s) => SIDE_NAME[s]).join(", ")}, you chose {SIDE_NAME[habit.next]} {habit.times} of{" "}
                  {habit.of} times.
                </p>
              </>
            ) : (
              <>
                <p className="cm-tell-num">
                  {lefts}
                  <small> left · </small>
                  {score.rights}
                  <small> right</small>
                </p>
                <p>No short pattern repeated reliably. That made you harder to read.</p>
              </>
            )}
            <p className="cm-dim">Habits like this are what the machine&rsquo;s pattern rules look for.</p>
          </article>
        </div>
      </section>

      <section className="cm-sec" aria-labelledby="cm-trust-h">
        <h2 id="cm-trust-h" className="serif cm-h2">
          What it trusted by the end
        </h2>
        <p className="cm-lede">
          The machine is seven simple rules voting. Each time a rule guessed right about you, the machine trusted it more; each
          time it was wrong, less. By your last choice it trusted this one most: <em>{ranked[0].tell}</em>
        </p>
        <ol className="cm-bars">
          {ranked.map((e) => (
            <li key={e.id}>
              <span className="cm-bar-name">
                {e.name}
                <span className="visually-hidden">: </span>
              </span>
              <span className="cm-bar-track">
                <span className="cm-bar-fill" style={{ width: `${Math.max(3, (finalWeights[e.id] / maxW) * 100)}%` }} />
              </span>
              <span className="cm-bar-tell">{e.tell}</span>
            </li>
          ))}
        </ol>
      </section>

      {stats && stats.runs >= 20 && (
        <section className="cm-sec cm-everyone" aria-labelledby="cm-all-h">
          <h2 id="cm-all-h" className="serif cm-h2">
            Everyone so far
          </h2>
          <div className="cm-stat-row">
            <p>
              <strong>{stats.sealedPct}%</strong>
              <span>sealed predictions right</span>
            </p>
            <p>
              <strong>{stats.allPct}%</strong>
              <span>of all choices predicted</span>
            </p>
            <p>
              <strong>{stats.switchPct}%</strong>
              <span>of the time, people switched sides</span>
            </p>
          </div>
          <p className="cm-dim">
            Across {stats.runs.toLocaleString("en")} runs on this site. A coin would score 50% on the first two.
          </p>
        </section>
      )}

      <VerifySeal seal={seal} />

      <Debrief />

      <Share hit={score.sealedHit} hits={score.hits} onAgain={onAgain} />
    </div>
  );
}

function VerifySeal({ seal }: { seal: Seal }) {
  const [check, setCheck] = useState<"idle" | "ok" | "bad">("idle");
  const text = commitText(seal.salt, seal.side);
  return (
    <section className="cm-sec cm-verify" aria-labelledby="cm-verify-h">
      <h2 id="cm-verify-h" className="serif cm-h2">
        Check the seal
      </h2>
      <p className="cm-lede">
        Before your last choice the machine wrote its prediction with a random code and showed you only a SHA-256 fingerprint of
        it on the wax seal. A different prediction would give a completely different fingerprint, so it couldn&rsquo;t change
        its answer after you chose.
      </p>
      <dl className="cm-code">
        <dt>Sealed text</dt>
        <dd>{text}</dd>
        <dt>SHA-256</dt>
        <dd>
          <mark>{seal.hash.slice(0, 12)}</mark>
          {seal.hash.slice(12)}
        </dd>
      </dl>
      <button
        className="cm-btn"
        onClick={async () => setCheck((await sha256Hex(text)) === seal.hash ? "ok" : "bad")}
        aria-describedby="cm-verify-out"
      >
        Recompute it
      </button>
      <p id="cm-verify-out" className="cm-dim" role="status">
        {check === "ok" && "✓ It matches the seal shown before you chose."}
        {check === "bad" && "✗ It doesn't match."}
        {check === "idle" && "The first twelve characters are the ones printed on the seal. Any SHA-256 tool gives the same result."}
      </p>
    </section>
  );
}

function Share({ hit, hits, onAgain }: { hit: boolean; hits: number; onAgain: () => void }) {
  const [note, setNote] = useState("");
  const text = shareText({ sealedHit: hit, hits });
  const send = async () => {
    const url = `${window.location.origin}/choice-machine`;
    try {
      if (navigator.share) await navigator.share({ text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setNote("Copied.");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setNote(url);
    }
  };
  return (
    <section className="cm-sec cm-share" aria-label="Share or play again">
      <p className="cm-share-text">&ldquo;{text}&rdquo;</p>
      <div className="cm-share-actions">
        <button className="cm-btn cm-btn--primary" onClick={send}>
          Send to a friend
        </button>
        <button
          className="cm-btn"
          onClick={() => {
            window.scrollTo({ top: 0 });
            onAgain();
          }}
        >
          Play again
        </button>
      </div>
      <p className="cm-dim" role="status">
        {note || "Playing again starts the machine from scratch. It doesn't remember you."}
      </p>
    </section>
  );
}
