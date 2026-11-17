import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import "./home.css";

type Experience = {
  slug: string;
  call: string;
  title: string;
  teaser: string;
  href?: string;
  cta?: string;
  tone: "ink" | "oxblood" | "moss" | "slate" | "umber";
  emblem: React.ReactNode;
};

const Hex = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M24 4 41 14v20L24 44 7 34V14z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M24 13 33 18.5v11L24 35l-9-5.5v-11z" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".7" />
  </svg>
);

const Mind = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.4 2.2" />
    {[0, 60, 120, 180, 240, 300].map((a) => {
      const r = (a * Math.PI) / 180;
      const x = 24 + Math.cos(r) * 16;
      const y = 24 + Math.sin(r) * 16;
      return (
        <g key={a}>
          <line x1={24 + Math.cos(r) * 6} y1={24 + Math.sin(r) * 6} x2={x} y2={y} stroke="currentColor" strokeWidth="1" opacity=".6" />
          <circle cx={x} cy={y} r="2.6" fill="currentColor" />
        </g>
      );
    })}
  </svg>
);

const Scale = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M24 8v32M12 40h24M10 16h28M10 16l-5 11h10zM38 16l-5 11h10z" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const Eye = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M4 24s7-12 20-12 20 12 20 12-7 12-20 12S4 24 4 24z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="24" cy="24" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const Crowd = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    {[12, 24, 36].map((x) => (
      <g key={x}>
        <circle cx={x} cy="18" r="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d={`M${x - 6} 34c0-5 3-8 6-8s6 3 6 8`} fill="none" stroke="currentColor" strokeWidth="1.4" />
      </g>
    ))}
  </svg>
);

const EXPERIENCES: Experience[] = [
  {
    slug: "babel",
    call: "No. 001",
    title: "Library of Babel",
    teaser: "Every book that could be written already waits here. Wander the infinite hexagons.",
    href: "/babel",
    cta: "Enter the stacks",
    tone: "ink",
    emblem: Hex,
  },
  {
    slug: "memory",
    call: "No. 002",
    title: "Memory That Lies",
    teaser: "Your memory is lying to you. Prove it.",
    href: "/memory",
    cta: "Start the experiment",
    tone: "oxblood",
    emblem: Mind,
  },
  {
    slug: "birth-lottery",
    call: "No. 003",
    title: "The Birth Lottery",
    teaser: "You didn't choose when or where you were born. Roll the dice and see what you got.",
    href: "/birth-lottery",
    cta: "Roll the dice",
    tone: "umber",
    emblem: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="24" cy="24" rx="7.5" ry="17" fill="none" stroke="currentColor" strokeWidth="1.1" opacity=".7" />
        <path d="M7.5 18.5h33M7.5 29.5h33" stroke="currentColor" strokeWidth="1.1" opacity=".7" />
        <circle cx="30" cy="16" r="2.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    slug: "missed",
    call: "No. 007",
    title: "The Thing You Missed",
    teaser: "Watch closely. Count carefully. Notice anything?",
    href: "/missed",
    cta: "Start watching",
    tone: "slate",
    emblem: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="7" y="7" width="34" height="34" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="17" r="3.2" fill="currentColor" />
        <circle cx="31" cy="30" r="3.2" fill="currentColor" />
        <circle cx="33" cy="15" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="15" cy="32" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M24 18.5l1.6 3.4 3.7.4-2.8 2.5.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.8-2.5 3.7-.4z" fill="none" stroke="currentColor" strokeWidth="1" opacity=".55" />
      </svg>
    ),
  },
  { slug: "bias", call: "No. 004", title: "Bias Lab", teaser: "The shortcuts your mind takes without asking.", tone: "moss", emblem: Scale },
  { slug: "change", call: "No. 005", title: "Change Blindness", teaser: "What changed? You were looking right at it.", tone: "slate", emblem: Eye },
  { slug: "crowd", call: "No. 006", title: "Crowd Wisdom", teaser: "Are a thousand guesses smarter than one?", tone: "umber", emblem: Crowd },
];

export default function Hub() {
  return (
    <div className="hub">
      <div className="hub-topbar">
        <ThemeToggle />
      </div>
      <header className="hub-head">
        <p className="hub-kicker">thelibrary.page</p>
        <h1 className="serif hub-title">The Library</h1>
        <p className="serif hub-sub">A small, growing shelf of experiments — in infinity, and in the mind.</p>
      </header>

      <main>
        <h2 className="visually-hidden">Experiences</h2>
        <ul className="shelf" role="list">
          {EXPERIENCES.map((x) => {
            const inner = (
              <>
                <span className="book-band" aria-hidden="true" />
                <span className="book-call">{x.call}</span>
                <span className="book-emblem">{x.emblem}</span>
                <span className="serif book-title">{x.title}</span>
                <span className="book-teaser">{x.teaser}</span>
                <span className="book-cta">{x.href ? <>{x.cta} <span aria-hidden="true">→</span></> : "Coming soon"}</span>
                <span className="book-band book-band--foot" aria-hidden="true" />
              </>
            );
            return (
              <li key={x.slug} className="shelf-slot">
                {x.href === "/babel" ? (
                  // Plain <a>: Babel has its own root layout, so this is a full page load either way.
                  <a className={`book book--${x.tone}`} href={x.href}>
                    {inner}
                  </a>
                ) : x.href ? (
                  <Link className={`book book--${x.tone}`} href={x.href}>
                    {inner}
                  </Link>
                ) : (
                  <div className={`book book--${x.tone} book--soon`} aria-disabled="true">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </main>

      <footer className="hub-foot">
        <p>
          Everything here is an educational demo — not a clinical or diagnostic test. No accounts, no tracking of who you are.
        </p>
      </footer>
    </div>
  );
}
