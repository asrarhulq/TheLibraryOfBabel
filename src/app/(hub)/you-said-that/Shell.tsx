import Link from "next/link";
import ThemeToggle from "../ThemeToggle";

export default function YstShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="yst-page">
      <nav className="yst-nav">
        <Link href="/" className="yst-back">
          <span aria-hidden="true">←</span> The Library
        </Link>
        <div className="yst-nav-right">
          <span className="yst-nav-title serif">You Said That?</span>
          <ThemeToggle />
        </div>
      </nav>
      <main className="yst-main">{children}</main>
      <footer className="yst-foot">
        An educational demonstration, not a psychological assessment. Anything you type stays on your device. Results are stored
        anonymously (no text, no IPs, no accounts).
      </footer>
    </div>
  );
}
