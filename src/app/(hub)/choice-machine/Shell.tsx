import Link from "next/link";
import { IBM_Plex_Mono } from "next/font/google";
import ThemeToggle from "../ThemeToggle";

const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export default function CmShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`cm-page ${mono.variable}`}>
      <nav className="cm-nav">
        <Link href="/" className="cm-back">
          <span aria-hidden="true">←</span> The Library
        </Link>
        <div className="cm-nav-right">
          <span className="cm-nav-title serif">The Choice Machine</span>
          <ThemeToggle />
        </div>
      </nav>
      <main className="cm-main">{children}</main>
      <footer className="cm-foot">
        An educational demonstration, not a psychological assessment. Only your eleven lefts and rights are stored, anonymously
        (no IPs, no accounts).
      </footer>
    </div>
  );
}
