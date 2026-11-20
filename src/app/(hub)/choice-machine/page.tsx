import type { Metadata } from "next";
import ChoiceMachine from "./ChoiceMachine";
import CmShell from "./Shell";
import "./cm.css";

const DESC = "Eleven quick choices, left or right. Before the last one, a machine seals its prediction. Can you beat it?";

export const metadata: Metadata = {
  title: "The Choice Machine",
  description: DESC,
  openGraph: { title: "The Choice Machine", description: DESC, url: "/choice-machine" },
  twitter: { card: "summary_large_image", title: "The Choice Machine", description: DESC },
};

export default function ChoiceMachinePage() {
  return (
    <CmShell>
      <ChoiceMachine />
    </CmShell>
  );
}
