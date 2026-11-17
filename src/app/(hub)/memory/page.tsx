import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "../ThemeToggle";
import MemoryExperience from "./MemoryExperience";
import "./memory.css";

export const metadata: Metadata = {
  title: "Memory That Lies",
  description: "Your memory is lying to you. Prove it. A four-minute browser experiment based on the classic DRM false-memory paradigm.",
  openGraph: {
    title: "Memory That Lies",
    description: "Your memory is lying to you. Prove it.",
    url: "/memory",
  },
};

export default function MemoryPage() {
  return (
    <div className="mem">
      <nav className="mem-nav">
        <Link href="/" className="mem-back">
          <span aria-hidden="true">←</span> The Library
        </Link>
        <div className="mem-nav-right">
          <span className="mem-nav-title serif">Memory That Lies</span>
          <ThemeToggle />
        </div>
      </nav>

      <main className="mem-main">
        <MemoryExperience />
      </main>

      <footer className="mem-foot">
        This is an educational demo, not a clinical or diagnostic test. Results are stored anonymously (no names, accounts or IP
        addresses) only to show how others did.
      </footer>
    </div>
  );
}
