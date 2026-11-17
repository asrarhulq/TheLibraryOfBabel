import Link from "next/link";
import ThemeToggle from "../ThemeToggle";

export default function MissedShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="ms-page">
      <nav className="ms-nav">
        <Link href="/" className="ms-back">
          <span aria-hidden="true">←</span> The Library
        </Link>
        <div className="ms-nav-right">
          <span className="ms-nav-title serif">The Thing You Missed</span>
          <ThemeToggle />
        </div>
      </nav>
      <main className="ms-main">{children}</main>
      <footer className="ms-foot">
        An educational demonstration, not a clinical or diagnostic test. Results are stored anonymously (no IPs, no accounts).
      </footer>
    </div>
  );
}
