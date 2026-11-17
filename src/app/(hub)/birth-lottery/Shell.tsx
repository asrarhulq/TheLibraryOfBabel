import Link from "next/link";
import ThemeToggle from "../ThemeToggle";

export default function BirthLotteryShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bl-page">
      <nav className="bl-nav">
        <Link href="/" className="bl-back">
          <span aria-hidden="true">←</span> The Library
        </Link>
        <div className="bl-nav-right">
          <span className="bl-nav-title serif">The Birth Lottery</span>
          <ThemeToggle />
        </div>
      </nav>
      <main className="bl-main">{children}</main>
      <footer className="bl-foot">
        An illustration built from historical estimates, not a prediction or a claim about anyone&rsquo;s ancestry. Rolls are
        stored anonymously (no IPs, no personal data) only to show the totals.
      </footer>
    </div>
  );
}
