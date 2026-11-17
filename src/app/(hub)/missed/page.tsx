import type { Metadata } from "next";
import Missed from "./Missed";
import MissedShell from "./Shell";
import "./missed.css";

export const metadata: Metadata = {
  title: "The Thing You Missed",
  description: "Watch closely. Count carefully. Notice anything? A 90-second attention test.",
  openGraph: { title: "The Thing You Missed", description: "A 90-second attention test. Count carefully.", url: "/missed" },
  twitter: { card: "summary_large_image", title: "The Thing You Missed", description: "A 90-second attention test. Count carefully." },
};

export default function MissedPage() {
  return (
    <MissedShell>
      <Missed />
    </MissedShell>
  );
}
