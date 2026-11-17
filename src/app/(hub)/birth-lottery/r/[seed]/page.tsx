import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { computeRoll } from "@/lib/birth-lottery/roll";
import BirthLottery from "../../BirthLottery";
import BirthLotteryShell from "../../Shell";
import "../../birth-lottery.css";

// GET /birth-lottery/r/:seed — the seed alone deterministically reproduces the roll.
type Props = { params: Promise<{ seed: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seed } = await params;
  const r = computeRoll(seed);
  if (!r) return { title: "The Birth Lottery" };
  const desc = `${r.sentence} Roll your own.`;
  return {
    title: `${r.yearLabel}, ${r.region.name} — The Birth Lottery`,
    description: desc,
    openGraph: { title: r.shareText, description: desc, url: `/birth-lottery/r/${r.seed}`, type: "website" },
    twitter: { card: "summary_large_image", title: r.shareText, description: desc },
  };
}

export default async function RollPage({ params }: Props) {
  const { seed } = await params;
  const r = computeRoll(seed);
  if (!r) notFound();
  return (
    <BirthLotteryShell>
      <BirthLottery initial={r} />
    </BirthLotteryShell>
  );
}
