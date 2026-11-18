import type { Metadata } from "next";
import YouSaidThat from "./YouSaidThat";
import YstShell from "./Shell";
import "./yst.css";

// Deliberately neutral copy: this page is also the "try it on a friend" link, so its preview must not
// give the trick away.
const DESC = "A quick taste test. Pick what you prefer, then tell us why.";

export const metadata: Metadata = {
  title: "You Said That?",
  description: DESC,
  openGraph: { title: "You Said That?", description: DESC, url: "/you-said-that" },
  twitter: { card: "summary_large_image", title: "You Said That?", description: DESC },
};

export default function YouSaidThatPage() {
  return (
    <YstShell>
      <YouSaidThat />
    </YstShell>
  );
}
