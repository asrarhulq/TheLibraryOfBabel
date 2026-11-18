import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { shareHeadline } from "@/lib/you-said-that/protocol";
import { H2012, J2005 } from "@/lib/you-said-that/research";
import { clientKey, rateLimit } from "@/lib/memory/rateLimit";
import YstShell from "../../Shell";
import { loadRun } from "./load";
import "../../yst.css";

// GET /you-said-that/r/:id — a shared result. The page asks before revealing anything.
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const run = await loadRun(id);
  if (!run) return { title: "You Said That?" };
  const text = shareHeadline(run.totals);
  return {
    title: "You Said That? — a result",
    description: text,
    openGraph: { title: text, description: "A five-minute test of choice and explanation.", url: `/you-said-that/r/${id}`, type: "website" },
    twitter: { card: "summary_large_image", title: text, description: "A five-minute test of choice and explanation." },
    robots: { index: false },
  };
}

export default async function ResultPage({ params }: Props) {
  const h = await headers();
  if (!rateLimit(`yst:perma:${clientKey(h as unknown as Headers)}`, 60, 60 * 1000).ok)
    return (
      <YstShell>
        <section className="yst-stage">
          <p className="yst-lede">Too many requests. Please try again in a minute.</p>
        </section>
      </YstShell>
    );
  const { id } = await params;
  const run = await loadRun(id);
  if (!run) notFound();
  const t = run.totals;
  return (
    <YstShell>
      <section className="yst-stage yst-enter">
        <p className="yst-kicker">A shared result</p>
        <h1 className="serif yst-h2">Someone took the taste test.</h1>
        <p className="yst-lede">Try it yourself first. The result below gives the trick away.</p>
        <Link className="yst-btn yst-btn--primary" href="/you-said-that">
          Take the test (about 5 minutes)
        </Link>
        <details className="yst-spoiler">
          <summary>Show their result (spoiler)</summary>
          <p className="yst-big">&ldquo;{shareHeadline(t)}&rdquo;</p>
          <p className="yst-dim">
            They were shown a swapped choice {t.manipulated} times: they noticed {t.detected} and defended {t.defended}. In the original
            face study only {J2005.concurrentPct}% of swaps were noticed at the time ({J2005.short}); in the survey study{" "}
            {H2012.failedAtLeastOnePct}% of people missed at least one of two reversed answers ({H2012.short}).
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="yst-share-img" src={`/you-said-that/r/${id}/card`} alt={`Result card: ${shareHeadline(t)}`} width={1200} height={630} />
        </details>
      </section>
    </YstShell>
  );
}
