import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMissedRun } from "@/lib/db/missedRuns";
import { buildScene } from "@/lib/missed/engine";
import { SC1999 } from "@/lib/missed/research";
import MissedShell from "../../Shell";
import { resultText } from "../../text";
import "../../missed.css";

// GET /missed/r/:id — a shared result. The page asks before revealing anything.
type Props = { params: Promise<{ id: string }> };
const ID_RE = /^[A-Za-z0-9]{10}$/;

async function load(id: string) {
  if (!ID_RE.test(id)) return null;
  try {
    const run = await getMissedRun(id);
    if (!run) return null;
    const seconds = Math.round(buildScene(run.seed, "critical", run.reducedMotion).star!.visibleSeconds);
    return { run, seconds };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const r = await load(id);
  if (!r) return { title: "The Thing You Missed" };
  const text = resultText(r.run.countAnswer, r.run.identified, r.seconds);
  return {
    title: "The Thing You Missed — a result",
    description: text,
    openGraph: { title: text, description: "A 90-second attention test.", url: `/missed/r/${id}`, type: "website" },
    twitter: { card: "summary_large_image", title: text, description: "A 90-second attention test." },
    robots: { index: false },
  };
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params;
  const r = await load(id);
  if (!r) notFound();
  const { run, seconds } = r;
  return (
    <MissedShell>
      <section className="ms-stage ms-enter">
        <p className="ms-kicker">A shared result</p>
        <h1 className="serif ms-h2">Someone took the attention test.</h1>
        <p className="ms-lede">Try it yourself first — the result below gives the trick away.</p>
        <Link className="ms-btn ms-btn--primary" href="/missed">
          Take the test (90 seconds)
        </Link>
        <details className="ms-spoiler">
          <summary>Show their result (spoiler)</summary>
          <p className="ms-big">&ldquo;{resultText(run.countAnswer, run.identified, seconds)}&rdquo;</p>
          <p className="ms-dim">
            They counted {run.countAnswer}; the right answer was {run.correctCount}.{" "}
            {run.identified ? "They spotted the magenta star." : "They missed the magenta star."} {run.r3Identified ? "When just watching, they saw it." : ""}
            {" "}In the classic study, {SC1999.missedPct}% of people missed the surprise ({SC1999.cite}).
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ms-share-img" src={`/missed/r/${id}/card`} alt="Result card" width={1200} height={630} />
        </details>
      </section>
    </MissedShell>
  );
}
