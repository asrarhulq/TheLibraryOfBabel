import type { Metadata } from "next";
import BirthLottery from "./BirthLottery";
import BirthLotteryShell from "./Shell";
import "./birth-lottery.css";

export const metadata: Metadata = {
  title: "The Birth Lottery",
  description: "You didn't choose when or where you were born. Roll the dice and see what you got — built from real historical data.",
  openGraph: {
    title: "The Birth Lottery",
    description: "About 117 billion humans have ever been born. You are one of them. Roll.",
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
