import { LIMITS, MOST2001, SC1999 } from "@/lib/missed/research";

export default function Debrief({ reduced }: { reduced: boolean }) {
  return (
    <section className="ms-debrief" aria-label="Debrief">
      <details open>
        <summary>How this works</summary>
        <p>
          Round 1 builds trust in the task. In round 2 a large magenta star (three times the size of the circles, and a different
          shape and colour from both teams) enters at 12 seconds, crosses the centre and leaves — at least half of it is visible
          for about 6 seconds. Round 3 shows the same scene without a task. The motion is generated from a random seed, and the
          true bounce count is computed exactly from it, on your device and again on the server.
          {reduced ? " Because reduced motion is on, the shapes moved more slowly and there were fewer bounces." : ""}
        </p>
      </details>
      <details>
        <summary>Limits</summary>
        <ul>
          {LIMITS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </details>
      <details>
        <summary>Sources</summary>
        <ul>
          <li>
            <a href={SC1999.url} target="_blank" rel="noreferrer">
              {SC1999.cite}
            </a>{" "}
            — {SC1999.missedPct}% of {SC1999.observers} observers missed the unexpected event; {SC1999.easyNoticedPct}% noticed with
            an easy task vs {SC1999.hardNoticedPct}% with a hard one.
          </li>
          <li>
            <a href={MOST2001.url} target="_blank" rel="noreferrer">
              {MOST2001.cite}
            </a>{" "}
            — similarity to the attended shapes changes noticing ({MOST2001.attendWhite.white}% white vs {MOST2001.attendWhite.black}% black
            cross while counting white); {100 - MOST2001.uniqueCrossNoticedPct}% missed a unique red cross visible for{" "}
            {MOST2001.uniqueCrossSeconds} s.
          </li>
        </ul>
      </details>
      <p className="ms-iq">How you did says nothing about your intelligence.</p>
    </section>
  );
}
