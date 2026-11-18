import type { Metadata } from "next";
import Missed from "./Missed";
import MissedShell from "./Shell";
import "./missed.css";

export const metadata: Metadata = {
  title: "The Thing You Missed",
  description: "A 90-second test: count the bouncing circles.",
  openGraph: { title: "The Thing You Missed", description: "A 90-second test: count the bouncing circles.", url: "/missed" },
  twitter: { card: "summary_large_image", title: "The Thing You Missed", description: "A 90-second test: count the bouncing circles." },
};

export default function MissedPage() {
  return (
    <MissedShell>
      <Missed />
    </MissedShell>
  );
}
