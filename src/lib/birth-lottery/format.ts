// Client-safe formatting + seed helpers.

export const MIN_YEAR = -10000;
export const maxYear = () => new Date().getFullYear();

/** Years are stored with negative = BCE (no year 0). */
export function yearLabel(y: number): string {
  if (y < 0) return `${Math.abs(y).toLocaleString("en-US")} BCE`;
  return y < 1000 ? `${y} CE` : String(y);
}

export function binLabel(start: number, end: number): string {
  const e = Math.min(end, maxYear());
  if (start < 0 && e <= 0) return `${Math.abs(start).toLocaleString("en-US")}–${Math.abs(e).toLocaleString("en-US")} BCE`;
  if (start < 0) return `${Math.abs(start)} BCE – ${e} CE`;
  return `${start}–${e}`;
}

export function compactNumber(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)} billion`;
  if (n >= 1e6) return `${Math.round(n / 1e6).toLocaleString("en-US")} million`;
  if (n >= 1e3) return `${Math.round(n / 1e3).toLocaleString("en-US")} thousand`;
  return String(Math.round(n));
}

const SEED_RE = /^(?:(\d{1,5})(bce)?-)?([a-z0-9]{8})$/;

export interface ParsedSeed {
  seed: string;
  mode: "random" | "year";
  year: number | null;
  token: string;
}

/** "k3j9x2pq" (random human) or "1347-k3j9x2pq" / "3000bce-k3j9x2pq" (picked year). */
export function parseSeed(raw: string): ParsedSeed | null {
  const s = raw.toLowerCase();
  const m = SEED_RE.exec(s);
  if (!m) return null;
  if (!m[1]) return { seed: s, mode: "random", year: null, token: m[3] };
  const n = Number(m[1]);
  const year = m[2] ? -n : n;
  if (n === 0 || year < MIN_YEAR || year > maxYear()) return null;
  return { seed: s, mode: "year", year, token: m[3] };
}

export function seedFor(token: string, year: number | null): string {
  if (year == null) return token;
  return year < 0 ? `${-year}bce-${token}` : `${year}-${token}`;
}

/** "4 in 10" for common outcomes, "1 in 26" for rare ones. */
export function oddsPhrase(pct: number): string {
  if (pct >= 10) return `${Math.round(pct / 10)} in 10`;
  if (pct > 0) return `1 in ${Math.round(100 / pct)}`;
  return "almost none";
}
