"use client";

import { useSyncExternalStore } from "react";

// One-button theme switch: flips between light and dark. Until someone clicks, the page follows
// the system setting; a click stores an explicit choice in localStorage and on <html data-theme>.

export type ThemePref = "system" | "light" | "dark";
export const THEME_KEY = "library-theme";
const EVENT = "library-theme-change";
const DARK_MQ = "(prefers-color-scheme: dark)";

function read(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

/** The theme actually showing: the stored choice, or the system setting if there is none. */
function resolved(): "light" | "dark" {
  const pref = read();
  if (pref !== "system") return pref;
  return window.matchMedia(DARK_MQ).matches ? "dark" : "light";
}

function subscribe(cb: () => void) {
  const mq = window.matchMedia(DARK_MQ);
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  mq.addEventListener("change", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
    mq.removeEventListener("change", cb);
  };
}

function apply(pref: ThemePref) {
  try {
    if (pref === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {
    /* storage blocked — still switch for this page view */
  }
  const root = document.documentElement;
  if (pref === "system") delete root.dataset.theme;
  else root.dataset.theme = pref;
  window.dispatchEvent(new Event(EVENT));
}

function setTheme(pref: ThemePref, origin?: { x: number; y: number }) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { ready: Promise<void> };
  };
  if (!doc.startViewTransition || reduce || !origin) {
    apply(pref);
    return;
  }
  const { x, y } = origin;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const t = doc.startViewTransition(() => apply(pref));
  t.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 700, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    })
    .catch(() => {});
}

const SUN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
  </svg>
);

const MOON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </svg>
);

export default function ThemeToggle({ className = "" }: { className?: string }) {
  // The server can't know the theme; it renders the dark-mode button and the client corrects it.
  const theme = useSyncExternalStore(subscribe, resolved, () => "dark" as const);
  const next = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} theme`;
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      title={label}
      aria-label={label}
      data-theme-now={theme}
      onClick={(e) => {
        const b = e.currentTarget.getBoundingClientRect();
        setTheme(next, { x: b.left + b.width / 2, y: b.top + b.height / 2 });
      }}
    >
      {theme === "dark" ? SUN : MOON}
    </button>
  );
}
