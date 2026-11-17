import "server-only";
import { randomBytes } from "node:crypto";
import data from "@/data/birth-lottery/data.json";
import { seededRandom, weightedPick } from "./rng";
import { binLabel, maxYear, oddsPhrase, parseSeed, seedFor, yearLabel, MIN_YEAR } from "./format";
import { milestonesWithin } from "./milestones";
import type { Field, Level, RollResult, SourceRef } from "./types";

// ── Data shapes (as written by scripts/birth-lottery/build-data.mjs) ─────────

interface RawField {
  v: number;
  src: string;
  lvl: Level;
  yr: number | null;
  note?: string;
  range?: [number, number];
}
interface Cell {
  b: number;
  r: number;
  pop: number;
  countries: [number, number][];
  e0: RawField;
  q5: RawField;
  q1: RawField;
  q15: RawField;
  e15: RawField;
  lit: RawField | null;
  agri: RawField | null;
  urban: RawField | null;
  lx: number[];
  model: { std: string; exact: boolean } | null;
  conf: "high" | "medium" | "low";
}
interface Data {
  version: number;
  sources: Record<string, Omit<SourceRef, "id">>;
  regions: { id: string; name: string; continent: string; centroid: [number, number] }[];
  countries: { iso3: string; num: string; name: string; region: number; centroid: [number, number] }[];
  worldPop: [number, number][];
  bins: { start: number; end: number; mid: number; births: number }[];
  cells: Cell[];
}

const D = data as unknown as Data;
const cellIndex = new Map(D.cells.map((c) => [`${c.b}|${c.r}`, c]));
const binBirths = D.bins.map((b) => b.births);

export const DATA_VERSION = D.version;

// ── Seeds ────────────────────────────────────────────────────────────────────

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
export function newSeed(year: number | null): string {
  const bytes = randomBytes(8);
  const token = Array.from(bytes, (b) => ALPHABET[b % 36]).join("");
  return seedFor(token, year);
}

export function isValidYear(y: unknown): y is number {
  return typeof y === "number" && Number.isInteger(y) && y !== 0 && y >= MIN_YEAR && y <= maxYear();
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function binFor(year: number): number {
  const i = D.bins.findIndex((b) => year >= b.start && year < b.end);
  return i < 0 ? D.bins.length - 1 : i;
}

function worldPopAt(t: number): number {
  const s = D.worldPop;
  if (t <= s[0][0]) return s[0][1];
  for (let i = 1; i < s.length; i++) {
    const [y, v] = s[i];
    if (y >= t) {
      const [y0, v0] = s[i - 1];
      return v0 * Math.pow(v / v0, (t - y0) / (y - y0));
    }
  }
  return s[s.length - 1][1];
}

const round1 = (x: number) => Math.round(x * 10) / 10;

function describe(f: RawField, regionName: string): string {
  switch (f.lvl) {
    case "region":
      return f.src === "wpp_life" ? `UN life table, ${regionName}, ${f.yr}` : `${f.note ?? "Regional estimate"}${f.yr ? `, around ${yearLabel(f.yr)}` : ""}`;
    case "continent":
      return `${f.note}${f.yr ? `, ${yearLabel(f.yr)}` : ""}`;
    case "world":
      return `${f.note}${f.yr ? `, ${yearLabel(f.yr)}` : ""}`;
    case "model":
      return "Modelled from a life table fitted to this era's estimates";
    default:
      return f.note ?? "";
  }
}

function field(f: RawField | null, regionName: string, transform: (v: number) => number = (v) => v): Field {
  if (!f) return { value: null, level: "none", note: "No estimate exists for this time and place", src: null, year: null };
  const out: Field = {
    value: round1(transform(f.v)),
    level: f.lvl,
    note: describe(f, regionName),
    src: f.src,
    year: f.yr,
  };
  if (f.range) {
    const [a, b] = f.range.map(transform);
    out.range = [round1(Math.min(a, b)), round1(Math.max(a, b))];
  }
  return out;
}

// ── The roll ─────────────────────────────────────────────────────────────────

export function computeRoll(rawSeed: string): RollResult | null {
  const parsed = parseSeed(rawSeed);
  if (!parsed) return null;
  const rand = seededRandom(`${parsed.seed}|v${D.version}`);
  const [uBin, uRegion, uCountry, uYear, uLife] = [rand(), rand(), rand(), rand(), rand()];

  // 1. era
  const bi = parsed.mode === "year" ? binFor(parsed.year!) : weightedPick(binBirths, uBin);
  const bin = D.bins[bi];

  // 2. region ∝ population in that era
  const regionCells = D.regions.map((_, ri) => cellIndex.get(`${bi}|${ri}`)!);
  const ri = weightedPick(
    regionCells.map((c) => c.pop),
    uRegion
  );
  const cell = regionCells[ri];
  const region = D.regions[ri];

  // 3. place ∝ population (present-day country, for the pin only)
  const ci = weightedPick(
    cell.countries.map(([, p]) => p),
    uCountry
  );
  const country = D.countries[cell.countries[ci][0]];

  // 4. year
  let year: number;
  if (parsed.mode === "year") year = parsed.year!;
  else {
    const end = Math.min(bin.end, maxYear() + 1);
    year = bin.start + Math.floor(uYear * (end - bin.start));
    if (year === 0) year = 1;
  }

  // 5. life
  const lx = cell.lx.map((v) => v / 10000);
  let outcomeAge: number | null = null;
  for (let x = 0; x < 80; x++) {
    if (uLife < 1 - lx[x + 1]) {
      outcomeAge = x;
      break;
    }
  }
  const youIndex = Math.min(99, Math.floor(uLife * 100));

  const stats: RollResult["stats"] = {
    survive1: field(cell.q1, region.name, (v) => 100 - v),
    survive5: field(cell.q5, region.name, (v) => 100 - v),
    survive15: field(cell.q15, region.name, (v) => 100 - v),
    e0: field(cell.e0, region.name),
    e15: field(cell.e15, region.name, (v) => 15 + v),
    literacy: field(cell.lit, region.name),
    agriculture: field(cell.agri, region.name),
    urban: field(cell.urban, region.name),
  };
  if (cell.lit?.lvl === "world") {
    stats.literacy.contextOnly = true;
    stats.literacy.note = `No regional estimate. ${cell.lit.note}, ${yearLabel(cell.lit.yr!)}: ${round1(cell.lit.v)}%`;
  }

  // Plain-language sentence, filled only from the numbers above.
  const died5 = 100 - (stats.survive5.value ?? 0);
  const adult = stats.e15.value ?? 0;
  const e0 = stats.e0.value ?? 0;
  let sentence =
    died5 >= 10
      ? `About ${Math.round(died5)} in 100 babies born here then did not live to see age 5.`
      : `${Math.round(100 - died5)} in 100 babies born here then lived to see age 5.`;
  sentence += ` Those who reached 15 could expect to live to about ${Math.round(adult)}.`;
  if (adult - e0 >= 15) sentence += ` Life expectancy at birth was only ${Math.round(e0)} because so many died as children.`;

  const shareText =
    died5 >= 1
      ? `I rolled ${yearLabel(year)}, ${region.name}. ${oddsPhrase(died5)} didn't see age 5.`
      : `I rolled ${yearLabel(year)}, ${region.name}. Almost every baby lived to see age 5.`;

  const srcIds = new Set<string>(["prb", "hyde_pop", "ne"]);
  for (const f of Object.values(stats)) if (f.src) srcIds.add(f.src);
  if (cell.model) srcIds.add("wpp_life");
  const sources: SourceRef[] = [...srcIds].filter((id) => D.sources[id]).map((id) => ({ id, ...D.sources[id] }));

  return {
    seed: parsed.seed,
    mode: parsed.mode,
    dataVersion: D.version,
    year,
    yearLabel: yearLabel(year),
    bin: { start: bin.start, end: bin.end, label: binLabel(bin.start, bin.end) },
    region: { id: region.id, name: region.name, continent: region.continent },
    country: { name: country.name, num: country.num, centroid: country.centroid },
    regionCountryNums: D.countries.filter((c) => c.region === ri).map((c) => c.num),
    worldPop: Math.round(worldPopAt(year)),
    confidence: cell.conf,
    stats,
    lx: lx.map((v) => Math.round(v * 10000) / 10000),
    outcomeAge,
    youIndex,
    sentence,
    shareText,
    milestones: milestonesWithin(year, year + (outcomeAge ?? 80)),
    model: cell.model ? { standard: cell.model.std, exact: cell.model.exact } : null,
    sources,
  };
}

/** Totals used on the intro screen. */
export function datasetFacts() {
  const total = binBirths.reduce((a, b) => a + b, 0);
  const after1950 = D.bins.filter((b) => b.start >= 1950).reduce((s, b) => s + b.births, 0);
  return { modelledBirths: total, shareAfter1950: after1950 / total };
}
