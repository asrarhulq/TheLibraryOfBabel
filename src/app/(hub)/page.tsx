import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import "./home.css";

type Experience = {
  slug: string;
  call: string;
  title: string;
  teaser: string;
  href?: string;
  tone: "ink" | "oxblood" | "moss" | "slate" | "umber" | "teal";
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

const AUTHOR = "Zor";

const EXPERIENCES: Experience[] = [
  {
    slug: "babel",
    call: "Combinatorics · after Borges",
    title: "Library of Babel",
    teaser: "A library holding every possible book. Browse the hexagons.",
    href: "/babel",
    tone: "ink",
    emblem: Hex,
  },
  {
    slug: "memory",
    call: "False memory (DRM)",
    title: "Memory That Lies",
    teaser: "Read some word lists, then see which words you remember.",
    href: "/memory",
    tone: "oxblood",
    emblem: Mind,
  },
  {
    slug: "birth-lottery",
    call: "Inequality of opportunity",
    title: "The Birth Lottery",
    teaser: "Pick someone at random from everyone ever born and see their odds of growing up.",
    href: "/birth-lottery",
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
    call: "Inattentional blindness",
    title: "The Thing You Missed",
    teaser: "Count the bouncing circles. It takes about 90 seconds.",
    href: "/missed",
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
  {
    slug: "you-said-that",
    call: "Choice blindness",
    title: "You Said That?",
    teaser: "Explain your choice. Are you sure it was yours?",
    href: "/you-said-that",
    tone: "moss",
    emblem: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="6" y="11" width="15" height="21" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="27" y="11" width="15" height="21" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="13.5" cy="21.5" r="4" fill="currentColor" />
        <path d="M30.5 25.5h8M34.5 17v8.5" stroke="currentColor" strokeWidth="1.4" opacity=".75" />
        <path d="M13 37c4 4.5 18 4.5 22 0M32.5 35.4l2.6 1.7-1.2 2.9" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".6" />
      </svg>
    ),
  },
  {
    slug: "choice-machine",
    call: "Predictability & free will",
    title: "The Choice Machine",
    teaser: "Make eleven quick choices. Before the last one, a machine seals its prediction.",
    href: "/choice-machine",
    tone: "teal",
    emblem: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="24" cy="20" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.1" opacity=".75" />
        <circle cx="24" cy="20" r="2.6" fill="currentColor" />
        <path d="M24 5.5v2.5M24 32v2.5M9.5 20H12M36 20h2.5" stroke="currentColor" strokeWidth="1.1" opacity=".6" />
        <path d="M8 41h10M8 41l3-2.5M8 41l3 2.5M40 41H30M40 41l-3-2.5M40 41l-3 2.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  { slug: "bias", call: "Cognitive biases", title: "Bias Lab", teaser: "Short tests of common reasoning errors.", tone: "moss", emblem: Scale },
  { slug: "change", call: "Change blindness", title: "Spot the Change", teaser: "Two versions of a picture. Find what's different.", tone: "slate", emblem: Eye },
  { slug: "crowd", call: "Wisdom of crowds", title: "A Thousand Guesses", teaser: "Does the average of many guesses beat one good one?", tone: "umber", emblem: Crowd },
];

export default function Hub() {
  return (
    <div className="hub">
      <div className="hub-topbar">
        <ThemeToggle />
      </div>
      <header className="hub-head">
        <h1 className="serif hub-title">The Library</h1>
        <p className="serif hub-sub">Small experiments in memory, attention and choice, and one infinite library.</p>
      </header>

      <main>
        <h2 className="visually-hidden">Experiences</h2>
        <ul className="shelf" role="list">
          {EXPERIENCES.map((x) => {
            const inner = (
              <>
                <span className="book-edge" aria-hidden="true" />
                <span className="book-page" aria-hidden="true" />
                {[1, 2, 3, 4].map((n) => (
                  <span key={n} className={`book-leaf book-leaf--${n}`} aria-hidden="true" />
                ))}
                <span className="book-cover">
                <span className="book-band" aria-hidden="true" />
                <span className="serif book-title">{x.title}</span>
                <span className="book-rule" aria-hidden="true" />
                <span className="serif book-sub">{x.call}</span>
                <span className="book-emblem">{x.emblem}</span>
                <span className="visually-hidden">. {x.teaser}</span>
                {!x.href && <span className="book-soon">Forthcoming</span>}
                <span className="serif book-author">
                  <span className="visually-hidden">by </span>
                  {AUTHOR}
                </span>
                <span className="book-band book-band--foot" aria-hidden="true" />
                </span>
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
          These are educational demos, not clinical or diagnostic tests. There are no accounts and no tracking.
        </p>
      </footer>
    </div>
  );
}
