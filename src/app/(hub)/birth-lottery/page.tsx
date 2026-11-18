import type { Metadata } from "next";
import BirthLottery from "./BirthLottery";
import BirthLotteryShell from "./Shell";
import "./birth-lottery.css";

export const metadata: Metadata = {
  title: "The Birth Lottery",
  description: "Pick a random person from everyone ever born and see their odds of surviving childhood, from historical data.",
  openGraph: {
    title: "The Birth Lottery",
    description: "About 117 billion people have ever been born. This picks one of them at random.",
    url: "/birth-lottery",
  },
};

export default function BirthLotteryPage() {
  return (
    <BirthLotteryShell>
      <BirthLottery initial={null} />
    </BirthLotteryShell>
  );
}
