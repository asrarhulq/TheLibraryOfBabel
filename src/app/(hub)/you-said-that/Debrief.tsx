import { H2012, J2005, NW1977 } from "@/lib/you-said-that/research";

export default function Debrief() {
  return (
    <section className="yst-debrief" aria-label="Debrief">
      <details open>
        <summary>How the original studies worked</summary>
        <p>
          In {J2005.short}, {J2005.participants} people saw {J2005.pairs} pairs of photographed faces and pointed to the one they found
          more attractive. The experimenter turned both pictures face down and slid one across; they picked it up and explained their
          choice. On {J2005.manipulatedPerPerson} pairs, {J2005.method} meant the picture they picked up was the face they had rejected. Of {J2005.mTrials} swapped trials,
          only {J2005.concurrentDetected} ({J2005.concurrentPct}%) were noticed at the time.
        </p>
        <p>
          In {H2012.short}, {H2012.participants} people rated {H2012.statements} moral statements on a paper survey. When they turned the
          page, {H2012.method} reversed two of the statements, so their own rating now supported the opposite view. They then read out
          and explained some of their answers.
        </p>
      </details>
      <details>
        <summary>Why this version may differ</summary>
        <ul>
          <li>It runs in a browser, with no experimenter. In the studies a real person handed over the card and asked the questions, which adds social pressure to go along.</li>
          <li>The stimuli are generated abstract compositions, not faces, and the statements are everyday values, not the original moral items.</li>
          <li>The swaps always happen on pairs 4, 7 and 9, and the &ldquo;That&rsquo;s not what I picked&rdquo; button is visible the whole time. That button probably makes noticing easier than in the studies, where people had to speak up unprompted.</li>
          <li>Part 2 reverses your answer on a scale rather than the wording of the statement.</li>
          <li>People who visit a page about psychology may be more suspicious than lab volunteers. Results here are not a scientific sample.</li>
        </ul>
      </details>
      <details>
        <summary>What this does not show</summary>
        <p>
          It does not show that you don&rsquo;t know your own mind in general, or that your preferences and values are fake. It shows
          something narrower: when asked <em>why</em>, we can build a sincere explanation after the fact, sometimes for a choice we
          didn&rsquo;t make. Most of the time our choices and our explanations line up, because nothing has been swapped.
        </p>
      </details>
      <details>
        <summary>Sources</summary>
        <ul>
          <li>
            <a href={J2005.url} target="_blank" rel="noreferrer">
              {J2005.cite}
            </a>{" "}
            — {J2005.concurrentPct}% of {J2005.mTrials} swapped trials detected at the time; no more than {J2005.totalExposedMaxPct}% by any
            measure, including afterwards.
          </li>
          <li>
            <a href={H2012.url} target="_blank" rel="noreferrer">
              {H2012.cite}
            </a>{" "}
            — {H2012.failedAtLeastOnePct}% failed to detect at least one of two reversals; {H2012.arguedOppositePct}% argued for the
            opposite of their original attitude at least once.
          </li>
          <li>
            <a href={NW1977.url} target="_blank" rel="noreferrer">
              {NW1977.cite}
            </a>{" "}
            — &ldquo;{NW1977.title}&rdquo;.
          </li>
        </ul>
      </details>
      <p className="yst-iq">How you did says nothing about your intelligence or your honesty.</p>
    </section>
  );
}
