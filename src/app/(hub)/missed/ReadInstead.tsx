import { MOST2001, SC1999 } from "@/lib/missed/research";
import Debrief from "./Debrief";

// Non-animated alternative for people who prefer reduced motion or can't watch animation.
export default function ReadInstead({ onBack }: { onBack: () => void }) {
  return (
    <section className="ms-stage ms-read ms-enter">
      <p className="ms-kicker">The plain explanation</p>
      <h1 className="serif ms-h2">The thing you missed</h1>
      <svg className="ms-still" viewBox="0 0 200 200" role="img" aria-label="A square arena with white and dark circles and a large magenta star in the middle">
        <rect width="200" height="200" rx="4" fill="#2b2723" />
        {[
          [30, 40, 1],
          [150, 60, 1],
          [60, 160, 1],
          [170, 150, 1],
          [90, 30, 0],
          [40, 110, 0],
          [140, 120, 0],
          [110, 175, 0],
        ].map(([x, y, w], i) => (
          <circle key={i} cx={x} cy={y} r="6.4" fill={w ? "#f6f1e7" : "#0c0a08"} stroke={w ? "none" : "rgba(255,255,255,.22)"} />
        ))}
        <path
          d="M100 81 L104.4 93.9 L118.1 94.1 L107.2 102.3 L111.2 115.4 L100 107.5 L88.8 115.4 L92.8 102.3 L81.9 94.1 L95.6 93.9 Z"
          fill="#ff2bd6"
          stroke="#fff0fc"
        />
      </svg>
      <div className="ms-explain ms-narrow">
        <p>
          The test asks you to count how often the white circles bounce off the walls. Halfway through, a large magenta star — three
          times the size of the circles — slowly crosses the middle of the screen for about 6 seconds.
        </p>
        <p>
          Many people who are busy counting never see it. In the classic study, {SC1999.missedPct}% of {SC1999.observers} people
          missed an unexpected event while counting ({SC1999.cite}); with abstract shapes, {100 - MOST2001.uniqueCrossNoticedPct}% missed a
          bright red cross ({MOST2001.cite}). The same object is easily seen by people who aren&rsquo;t busy counting (Most et al., 2001).
        </p>
        <p>
          You only become aware of what your attention is on. This is called <strong>inattentional blindness</strong>, and it
          isn&rsquo;t carelessness: being able to focus on one thing means other things get filtered out.
        </p>
      </div>
      <button className="ms-btn" onClick={onBack}>
        Back
      </button>
      <Debrief reduced />
    </section>
  );
}
