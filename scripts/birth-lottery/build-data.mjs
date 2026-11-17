#!/usr/bin/env node
// Build-time data pipeline for "The Birth Lottery".
//
//   node scripts/birth-lottery/build-data.mjs            # download (cached) + build
//   BL_CACHE=/some/dir node scripts/birth-lottery/build-data.mjs
//
// Downloads public datasets (see DATA_SOURCES.md), aggregates them into
// region × time-bin cells, and writes:
//   src/data/birth-lottery/data.json          (server-side lookup table, all numbers traceable)
//   public/birth-lottery/countries-110m.json  (Natural Earth country shapes via world-atlas, for the globe)
//   scripts/birth-lottery/sanity-report.md    (10 sample cells vs. raw source values)
//
// Rules: no number is invented. Where a region/era has no data, the cell falls back to a
// coarser level (continent → world → earliest available estimate) and records that it did.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { geoCentroid } from "d3-geo";
import { feature } from "topojson-client";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CACHE = process.env.BL_CACHE || path.join(os.tmpdir(), "birth-lottery-cache");
fs.mkdirSync(CACHE, { recursive: true });

// ── Sources ─────────────────────────────────────────────────────────────────

const OWID = (slug) => `https://ourworldindata.org/grapher/${slug}.csv?v=1&csvType=full&useColumnShortNames=true`;
const FILES = {
  population: OWID("population"),
  lifeExp: OWID("life-expectancy"),
  childMort: OWID("child-mortality"),
  literacy: OWID("cross-country-literacy-rates"),
  agri: OWID("share-of-employment-in-agriculture"),
  urban: OWID("long-term-urban-population-region"),
  wppLife:
    "https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Life_Table_Abridged_Medium_1950-2023.csv.gz",
  worldAtlas: "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json",
};

export const SOURCES = {
  hyde_pop: {
    name: "Population (HYDE 3.3, Gapminder, UN WPP 2024)",
    by: "Our World in Data",
    url: "https://ourworldindata.org/grapher/population",
    license: "CC BY 4.0",
  },
  hyde_urban: {
    name: "Share of population in urban areas (HYDE 3.5)",
    by: "PBL Netherlands Environmental Assessment Agency, via Our World in Data",
    url: "https://ourworldindata.org/grapher/long-term-urban-population-region",
    license: "CC BY 4.0",
  },
  wpp_life: {
    name: "World Population Prospects 2024, abridged life tables (both sexes)",
    by: "UN DESA Population Division",
    url: "https://population.un.org/wpp/downloads",
    license: "CC BY 3.0 IGO",
  },
  owid_e0: {
    name: "Life expectancy at birth, long-run (Riley 2005; Zijdeman et al. 2015; HMD; UN WPP)",
    by: "Our World in Data",
    url: "https://ourworldindata.org/grapher/life-expectancy",
    license: "CC BY 4.0",
  },
  owid_q5: {
    name: "Child mortality before age 5, long-run (Gapminder 2015; UN IGME)",
    by: "Our World in Data",
    url: "https://ourworldindata.org/grapher/child-mortality",
    license: "CC BY 4.0",
  },
  owid_lit: {
    name: "Literacy rate (Buringh & van Zanden 2009; van Zanden et al. 2014; UNESCO)",
    by: "Our World in Data",
    url: "https://ourworldindata.org/grapher/cross-country-literacy-rates",
    license: "CC BY 4.0",
  },
  owid_agri: {
    name: "Share of employment in agriculture (ILO modelled estimates; Broadberry & Gardner 2013)",
    by: "Our World in Data",
    url: "https://ourworldindata.org/grapher/share-of-employment-in-agriculture",
    license: "CC BY 4.0",
  },
  prb: {
    name: "How Many People Have Ever Lived on Earth? (Kaneda & Haub, 2022)",
    by: "Population Reference Bureau",
    url: "https://www.prb.org/articles/how-many-people-have-ever-lived-on-earth/",
    license: "Cited figures (birth rates per era, ~117 billion total)",
  },
  writing: {
    name: "Earliest known writing: Mesopotamian proto-cuneiform, c. 3200 BCE",
    by: "Widely documented archaeological dating",
    url: "https://en.wikipedia.org/wiki/History_of_writing",
    license: "Fact",
  },
  ne: {
    name: "Country shapes (Natural Earth 1:110m, via world-atlas)",
    by: "Natural Earth / Mike Bostock",
    url: "https://github.com/topojson/world-atlas",
    license: "Public domain (Natural Earth), ISC (world-atlas)",
  },
};

// PRB (2022) Table 1: births per 1,000 population for the period ending at each benchmark.
// The 1900–1950 period is given as a range (31–38); we use its midpoint, 34.5.
const PRB_CBR = [
  [-8000, 80], // 50,000 BCE – 8000 BCE (used from 10,000 BCE)
  [1, 80],
  [1200, 60],
  [1650, 60],
  [1750, 50],
  [1850, 40],
  [1900, 40],
  [1950, 34.5],
  [2000, 22],
  [2010, 20],
  [9999, 17],
];
const cbrAt = (t) => PRB_CBR.find(([end]) => t <= end)[1] / 1000;

// ── Regions: UN M49 geographic subregions (as used by UN WPP) ───────────────

export const REGIONS = [
  ["eastern-africa", "Eastern Africa", "Africa"],
  ["middle-africa", "Middle Africa", "Africa"],
  ["northern-africa", "Northern Africa", "Africa"],
  ["southern-africa", "Southern Africa", "Africa"],
  ["western-africa", "Western Africa", "Africa"],
  ["eastern-asia", "Eastern Asia", "Asia"],
  ["central-asia", "Central Asia", "Asia"],
  ["southern-asia", "Southern Asia", "Asia"],
  ["south-eastern-asia", "South-Eastern Asia", "Asia"],
  ["western-asia", "Western Asia", "Asia"],
  ["eastern-europe", "Eastern Europe", "Europe"],
  ["northern-europe", "Northern Europe", "Europe"],
  ["southern-europe", "Southern Europe", "Europe"],
  ["western-europe", "Western Europe", "Europe"],
  ["caribbean", "Caribbean", "Americas"],
  ["central-america", "Central America", "Americas"],
  ["south-america", "South America", "Americas"],
  ["northern-america", "Northern America", "Americas"],
  ["australia-nz", "Australia/New Zealand", "Oceania"],
  ["melanesia", "Melanesia", "Oceania"],
  ["micronesia", "Micronesia", "Oceania"],
  ["polynesia", "Polynesia", "Oceania"],
].map(([id, name, continent]) => ({ id, name, continent }));

// Time bins: 500y before 1000 CE, 100y to 1800, 25y to 1950, 5y after. [start, end)
function makeBins() {
  const b = [];
  for (let s = -10000; s < 1000; s += 500) b.push([s, s + 500]);
  for (let s = 1000; s < 1800; s += 100) b.push([s, s + 100]);
  for (let s = 1800; s < 1950; s += 25) b.push([s, s + 25]);
  for (let s = 1950; s < 2020; s += 5) b.push([s, s + 5]);
  b.push([2020, 2027]); // present
  return b;
}

const AGES = [0, 1, 5, ...Array.from({ length: 19 }, (_, i) => (i + 2) * 5)]; // 0,1,5,10,...,100

// ── Download + parse helpers ────────────────────────────────────────────────

async function cached(key, url) {
  const ext = url.endsWith(".gz") ? ".csv.gz" : url.includes(".json") ? ".json" : ".csv";
  const p = path.join(CACHE, key + ext);
  if (!fs.existsSync(p) || fs.statSync(p).size < 100) {
    process.stdout.write(`  downloading ${key} … `);
    const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "birth-lottery-data-build" } });
    if (!res.ok) throw new Error(`${key}: HTTP ${res.status}`);
    fs.writeFileSync(p, Buffer.from(await res.arrayBuffer()));
    console.log("ok");
  }
  return p;
}

function parseCsvLine(line) {
  const out = [];
  let cur = "",
    q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') (cur += '"'), i++;
        else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") out.push(cur), (cur = "");
    else cur += c;
  }
  out.push(cur);
  return out;
}

/** OWID csv → Map(entityCodeOrName → sorted [[year, value], …]) */
function loadOwid(p) {
  const lines = fs.readFileSync(p, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const m = new Map();
  for (const line of lines.slice(1)) {
    const [entity, code, y, v] = parseCsvLine(line);
    if (v === "" || v === undefined) continue;
    const key = code && !code.startsWith("OWID_") ? code : entity;
    if (!m.has(key)) m.set(key, []);
    m.get(key).push([Number(y), Number(v)]);
  }
  for (const s of m.values()) s.sort((a, b) => a[0] - b[0]);
  return m;
}

async function loadWpp(p) {
  // Keep both-sexes rows: country tables 1950–1959 (analogue standards) and every
  // subregion/Northern America table (direct regional data 1950+).
  const tables = new Map(); // `${locId}|${year}` → {lx:{age:lx}, ex:{age:ex}}
  const locs = new Map(); // locId → {iso3, type, parent, name}
  const rl = readline.createInterface({ input: fs.createReadStream(p).pipe(zlib.createGunzip()) });
  let header = null;
  for await (const raw of rl) {
    const line = raw.replace(/^﻿/, "");
    if (!header) {
      header = parseCsvLine(line);
      continue;
    }
    const r = parseCsvLine(line);
    const get = (k) => r[header.indexOf(k)];
    if (get("Sex") !== "Total") continue;
    const locId = get("LocID");
    const type = get("LocTypeName");
    const name = get("Location");
    if (!locs.has(locId)) locs.set(locId, { iso3: get("ISO3_code"), type, parent: get("ParentID"), name });
    const year = Number(get("Time"));
    const keep = (type === "Country/Area" && year <= 1959) || type === "Subregion" || name === "Northern America";
    if (!keep) continue;
    const key = `${locId}|${year}`;
    if (!tables.has(key)) tables.set(key, { lx: {}, ex: {} });
    const t = tables.get(key);
    const age = Number(get("AgeGrpStart"));
    t.lx[age] = Number(get("lx"));
    t.ex[age] = Number(get("ex"));
  }
  return { tables, locs };
}

// ── Numeric helpers ─────────────────────────────────────────────────────────

const round = (x, d = 1) => (x == null ? null : Math.round(x * 10 ** d) / 10 ** d);

/** Linear interpolation inside a sorted series; null outside its range. */
function interp(series, t) {
  if (!series || !series.length) return null;
  if (t < series[0][0] || t > series[series.length - 1][0]) return null;
  for (let i = 0; i < series.length; i++) {
    const [y, v] = series[i];
    if (y === t) return v;
    if (y > t) {
      const [y0, v0] = series[i - 1];
      return v0 + ((v - v0) * (t - y0)) / (y - y0);
    }
  }
  return null;
}

/** Log-linear (constant growth) interpolation, for population. */
function interpLog(series, t) {
  if (!series || t < series[0][0] || t > series[series.length - 1][0]) return null;
  for (let i = 0; i < series.length; i++) {
    const [y, v] = series[i];
    if (y === t) return v;
    if (y > t) {
      const [y0, v0] = series[i - 1];
      if (v0 <= 0 || v <= 0) return v0 + ((v - v0) * (t - y0)) / (y - y0);
      return v0 * Math.pow(v / v0, (t - y0) / (y - y0));
    }
  }
  return null;
}

/** Value at t: interpolated if bracketed, else the nearest point within ±window. */
function valueNear(series, t, window) {
  if (!series || !series.length) return null;
  const iv = interp(series, t);
  if (iv != null) {
    // only trust interpolation if both neighbours are within 2×window
    let lo = null,
      hi = null;
    for (const p of series) {
      if (p[0] <= t) lo = p;
      if (p[0] >= t && !hi) hi = p;
    }
    if (lo && hi && hi[0] - lo[0] <= Math.max(2 * window, 1)) return { v: iv, y: t };
  }
  let best = null;
  for (const [y, v] of series) if (Math.abs(y - t) <= window && (!best || Math.abs(y - t) < Math.abs(best.y - t))) best = { v, y };
  return best;
}

// Life-table helpers (abridged nodes AGES, lx normalised to 1 at age 0)
function yearly(lxNodes) {
  const out = [];
  for (let x = 0; x <= 100; x++) {
    let i = AGES.findIndex((a, k) => a <= x && (AGES[k + 1] ?? 999) > x);
    if (x === 100) i = AGES.length - 1;
    const a = AGES[i],
      b = AGES[i + 1];
    if (b === undefined) out.push(lxNodes[i]);
    else {
      const la = lxNodes[i],
        lb = lxNodes[i + 1];
      out.push(la > 0 && lb > 0 ? la * Math.pow(lb / la, (x - a) / (b - a)) : la + ((lb - la) * (x - a)) / (b - a));
    }
  }
  return out;
}
function lifeExp(ly, e100, from = 0) {
  // person-years with a0 = 0.3 for the first year of life (high-mortality convention)
  let T = 0;
  for (let x = from; x < 100; x++) {
    if (x === 0) T += ly[1] + 0.3 * (ly[0] - ly[1]);
    else T += (ly[x] + ly[x + 1]) / 2;
  }
  T += ly[100] * e100;
  return ly[from] > 0 ? T / ly[from] : 0;
}
const logit = (l) => 0.5 * Math.log((1 - l) / l);
const unlogit = (y) => 1 / (1 + Math.exp(2 * y));

function brass(std, alpha, beta) {
  return AGES.map((a, i) => (a === 0 ? 1 : unlogit(alpha + beta * logit(Math.min(Math.max(std.lx[i], 1e-9), 1 - 1e-9)))));
}
function summarizeTable(lxNodes, e100) {
  const ly = yearly(lxNodes);
  return {
    ly,
    e0: lifeExp(ly, e100, 0),
    e15: lifeExp(ly, e100, 15),
    q1: 1 - ly[1],
    q5: 1 - ly[5],
    q15: 1 - ly[15],
  };
}

/** Brass relational logit fit of a standard table to targets {q5?, e0?}. */
function fitBrass(std, targets) {
  const { q5, e0 } = targets;
  const Ys5 = logit(std.lx[AGES.indexOf(5)]);
  const at = (alpha, beta) => summarizeTable(brass(std, alpha, beta), std.e100);
  if (q5 != null && e0 != null) {
    const alphaFor = (beta) => logit(1 - q5) - beta * Ys5;
    const err = (beta) => at(alphaFor(beta), beta).e0 - e0;
    let lo = 0.3,
      hi = 2.5,
      elo = err(lo),
      ehi = err(hi);
    if (Math.sign(elo) === Math.sign(ehi)) {
      // no exact solution: take the closest β on a grid
      let best = 1,
        be = Infinity;
      for (let b = 0.3; b <= 2.5; b += 0.01) {
        const e = Math.abs(err(b));
        if (e < be) (be = e), (best = b);
      }
      return { alpha: alphaFor(best), beta: best, exact: false };
    }
    for (let k = 0; k < 60; k++) {
      const mid = (lo + hi) / 2,
        em = err(mid);
      if (Math.sign(em) === Math.sign(elo)) (lo = mid), (elo = em);
      else hi = mid;
    }
    const beta = (lo + hi) / 2;
    return { alpha: alphaFor(beta), beta, exact: true };
  }
  if (q5 != null) return { alpha: logit(1 - q5) - Ys5, beta: 1, exact: true };
  if (e0 != null) {
    let lo = -3,
      hi = 3;
    for (let k = 0; k < 60; k++) {
      const mid = (lo + hi) / 2;
      if (at(mid, 1).e0 > e0) lo = mid;
      else hi = mid;
    }
    return { alpha: (lo + hi) / 2, beta: 1, exact: true };
  }
  return { alpha: 0, beta: 1, exact: true };
}

// ── Build ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("Birth Lottery data build — cache:", CACHE);
  const P = {};
  for (const [k, url] of Object.entries(FILES)) P[k] = await cached(k, url);

  const pop = loadOwid(P.population);
  const e0S = loadOwid(P.lifeExp);
  const q5S = loadOwid(P.childMort);
  const litS = loadOwid(P.literacy);
  const agriS = loadOwid(P.agri);
  const urbS = loadOwid(P.urban);
  console.log("  parsing UN life tables (large) …");
  const { tables, locs } = await loadWpp(P.wppLife);

  // Country → region (via WPP hierarchy: country parent = subregion; US/Canada/… parent = Northern America)
  const locByName = new Map([...locs].map(([id, l]) => [l.name, id]));
  const regionLoc = REGIONS.map((r) => locByName.get(r.name));
  if (regionLoc.some((x) => !x)) throw new Error("missing WPP region");
  const countries = []; // {iso3, num, name, region}
  for (const [id, l] of locs) {
    if (l.type !== "Country/Area" || !l.iso3) continue;
    // WPP gives no subregion for Northern America's countries; they belong to that region.
    const parentName = ["USA", "CAN", "BMU", "GRL", "SPM"].includes(l.iso3) ? "Northern America" : locs.get(l.parent)?.name;
    const ri = REGIONS.findIndex((r) => r.name === parentName);
    if (ri < 0) continue;
    if (!pop.has(l.iso3)) continue;
    countries.push({ iso3: l.iso3, num: String(id).padStart(3, "0"), name: l.name, region: ri });
  }
  const byRegion = REGIONS.map((_, ri) => countries.filter((c) => c.region === ri));
  const worldPopS = pop.get("World");

  // Coverage check: our countries vs. World
  for (const t of [-5000, 1, 1500, 1900, 2000]) {
    const sum = countries.reduce((s, c) => s + (interpLog(pop.get(c.iso3), t) ?? 0), 0);
    console.log(`  population coverage ${t}: ${((sum / interpLog(worldPopS, t)) * 100).toFixed(1)}% of world`);
  }

  // Analogue standards: WPP country tables 1950–1959
  const standards = [];
  for (const [key, t] of tables) {
    const [locId, y] = key.split("|");
    const l = locs.get(locId);
    if (l.type !== "Country/Area") continue;
    const lx = AGES.map((a) => t.lx[a] / t.lx[0]);
    if (lx.some((v) => !(v > 0))) continue;
    const s = summarizeTable(lx, t.ex[100]);
    standards.push({ name: `${l.name} ${y}`, lx, e100: t.ex[100], q5: s.q5, e0: s.e0, wppE0: t.ex[0] });
  }
  // Validate our life-expectancy integration against WPP's own e0
  const dev = standards.map((s) => Math.abs(s.e0 - s.wppE0));
  console.log(`  e0 integration check: mean |ours − WPP| = ${(dev.reduce((a, b) => a + b, 0) / dev.length).toFixed(2)} y over ${standards.length} tables`);
  const minE0 = Math.min(...standards.map((s) => s.e0));
  console.log(`  standards e0 range: ${minE0.toFixed(1)}–${Math.max(...standards.map((s) => s.e0)).toFixed(1)}`);

  const pickStandard = ({ q5, e0 }) => {
    let best = null,
      bd = Infinity;
    for (const s of standards) {
      const d = (q5 != null ? ((s.q5 - q5) / 0.05) ** 2 : 0) + (e0 != null ? ((s.e0 - e0) / 2.5) ** 2 : 0);
      if (d < bd) (bd = d), (best = s);
    }
    return best;
  };

  const regionPop = (ri, t) => byRegion[ri].reduce((s, c) => s + (interpLog(pop.get(c.iso3), t) ?? 0), 0);

  /** Population-weighted mean of a country-level series across a region. */
  function regionalAgg(series, ri, t, window, minCoverage) {
    let wsum = 0,
      vsum = 0,
      total = 0,
      n = 0,
      ys = [];
    for (const c of byRegion[ri]) {
      const p = interpLog(pop.get(c.iso3), t) ?? 0;
      total += p;
      const hit = valueNear(series.get(c.iso3), t, window);
      if (hit && p > 0) (wsum += p), (vsum += p * hit.v), n++, ys.push(hit.y);
    }
    if (!total || wsum / total < minCoverage) return null;
    return { v: vsum / wsum, coverage: wsum / total, n, yr: Math.round(ys.reduce((a, b) => a + b, 0) / ys.length) };
  }

  const bins = makeBins();
  const cells = [];
  const binsOut = [];
  for (const [bs, be] of bins) {
    const mid = Math.floor((bs + Math.min(be, 2025)) / 2);
    const half = (Math.min(be, 2025) - bs) / 2;
    const window = Math.min(Math.max(half, 10), 60);
    // births in bin = Σ CBR(t) · pop(t)
    let births = 0;
    for (let y = bs; y < Math.min(be, 2025); y++) births += cbrAt(y) * (interpLog(worldPopS, y) ?? 0);
    binsOut.push({ start: bs, end: be, mid, births: Math.round(births) });

    for (let ri = 0; ri < REGIONS.length; ri++) {
      const R = REGIONS[ri];
      const rp = regionPop(ri, mid);
      const cpop = byRegion[ri]
        .map((c) => [countries.indexOf(c), Math.round(interpLog(pop.get(c.iso3), mid) ?? 0)])
        .filter(([, p]) => p > 0);
      const cell = { b: binsOut.length - 1, r: ri, pop: Math.round(rp), countries: cpop };

      // ── mortality ──
      if (mid >= 1950) {
        const ty = Math.min(mid, 2023);
        const t = tables.get(`${regionLoc[ri]}|${ty}`);
        const lx = AGES.map((a) => t.lx[a] / t.lx[0]);
        const s = summarizeTable(lx, t.ex[100]);
        const src = { src: "wpp_life", lvl: "region", yr: ty };
        cell.e0 = { v: round(t.ex[0]), ...src };
        cell.q5 = { v: round(s.q5 * 100), ...src };
        cell.q1 = { v: round(s.q1 * 100), ...src };
        cell.q15 = { v: round(s.q15 * 100), ...src };
        cell.e15 = { v: round(t.ex[15]), ...src };
        cell.lx = s.ly.slice(0, 81).map((v) => Math.round(v * 10000));
        cell.model = null;
      } else {
        // e0: countries → continent (Riley/OWID) → world → stand-in
        let e0 = regionalAgg(e0S, ri, mid, window, 0.5);
        if (e0) e0 = { v: e0.v, src: "owid_e0", lvl: "region", yr: e0.yr, note: `${e0.n} countries, ${Math.round(e0.coverage * 100)}% of population` };
        else {
          // Riley's continental series is sparse by design (e.g. Asia: 1770, 1885); interpolate within it.
          // Never reach forward in time: before a series starts, it's a labelled stand-in instead.
          const within = (S) => (S && mid >= S[0][0] ? valueNear(S, mid, 150) : null);
          const cont = R.continent === "Oceania" && mid < 1870 ? null : within(e0S.get(R.continent));
          const world = within(e0S.get("World"));
          if (cont) e0 = { v: cont.v, src: "owid_e0", lvl: "continent", yr: cont.y, note: `${R.continent} average (Riley 2005)` };
          else if (world) e0 = { v: world.v, src: "owid_e0", lvl: "world", yr: world.y, note: "World average (Riley 2005)" };
          else {
            const contS = R.continent === "Oceania" ? null : e0S.get(R.continent);
            const first = (contS ?? e0S.get("World"))[0];
            e0 = {
              v: first[1],
              src: "owid_e0",
              lvl: "standin",
              yr: first[0],
              note: `No estimate before ${first[0]}; using the earliest ${contS ? R.continent : "world"} estimate (${first[0]})`,
            };
          }
          // honest spread: continental estimates around the year used
          const ry = e0.yr;
          const conts = ["Africa", "Americas", "Asia", "Europe", "Oceania"]
            .map((c) => valueNear(e0S.get(c), ry, 30))
            .filter(Boolean)
            .map((x) => x.v);
          if (conts.length >= 2) e0.range = [round(Math.min(...conts)), round(Math.max(...conts))];
        }
        // q5: countries → world → stand-in (no continental series exists before 1950)
        let q5 = regionalAgg(q5S, ri, mid, window, 0.5);
        if (q5) q5 = { v: q5.v, src: "owid_q5", lvl: "region", yr: q5.yr, note: `${q5.n} countries, ${Math.round(q5.coverage * 100)}% of population` };
        else {
          const W = q5S.get("World");
          const world = mid >= W[0][0] ? valueNear(W, mid, window) : null;
          if (world) q5 = { v: world.v, src: "owid_q5", lvl: "world", yr: world.y, note: "World average (Gapminder)" };
          else {
            const first = q5S.get("World")[0];
            q5 = { v: first[1], src: "owid_q5", lvl: "standin", yr: first[0], note: `No estimate before ${first[0]}; using the earliest world estimate (${first[0]})` };
          }
          const recs = byRegion
            .flat()
            .map((c) => valueNear(q5S.get(c.iso3), q5.yr, 25))
            .filter(Boolean)
            .map((x) => x.v);
          if (recs.length >= 3) q5.range = [round(Math.min(...recs)), round(Math.max(...recs))];
        }
        const std = pickStandard({ q5: q5.v / 100, e0: e0.v });
        const fit = fitBrass(std, { q5: q5.v / 100, e0: e0.v });
        const lxN = brass(std, fit.alpha, fit.beta);
        const s = summarizeTable(lxN, std.e100);
        const modelled = { src: "wpp_life", lvl: "model", yr: null };
        cell.e0 = { ...e0, v: round(e0.v) };
        cell.q5 = { ...q5, v: round(q5.v) };
        cell.q1 = { v: round(s.q1 * 100), ...modelled };
        cell.q15 = { v: round(s.q15 * 100), ...modelled };
        cell.e15 = { v: round(s.e15), ...modelled };
        cell.lx = s.ly.slice(0, 81).map((v) => Math.round(v * 10000));
        cell.model = { std: std.name, alpha: round(fit.alpha, 3), beta: round(fit.beta, 3), exact: fit.exact, fitE0: round(s.e0), fitQ5: round(s.q5 * 100) };
      }

      // ── literacy ──
      if (be <= -3200) cell.lit = { v: 0, src: "writing", lvl: "fact", yr: null, note: "Writing had not yet been invented (earliest known: Mesopotamia, c. 3200 BCE)" };
      else {
        const reg = regionalAgg(litS, ri, mid, window, 0.5);
        if (reg) cell.lit = { v: round(reg.v), src: "owid_lit", lvl: "region", yr: reg.yr, note: `${reg.n} countries, ${Math.round(reg.coverage * 100)}% of population` };
        else {
          const we = ["Western Europe", "Northern Europe", "Southern Europe"].includes(R.name)
            ? valueNear(litS.get("Western Europe (Buringh and van Zanden)"), mid, Math.max(window, 50))
            : null;
          const LW = litS.get("World");
          const world = mid >= LW[0][0] ? valueNear(LW, mid, window) : null;
          if (we) cell.lit = { v: round(we.v), src: "owid_lit", lvl: "continent", yr: we.y, note: "Western Europe average (Buringh & van Zanden 2009)" };
          else if (world) cell.lit = { v: round(world.v), src: "owid_lit", lvl: "world", yr: world.y, note: "World average (van Zanden et al. 2014)" };
          else cell.lit = null;
        }
      }

      // ── agriculture ──
      const ag = regionalAgg(agriS, ri, mid, window, 0.4);
      cell.agri = ag ? { v: round(ag.v), src: "owid_agri", lvl: "region", yr: ag.yr, note: `${ag.n} countries, ${Math.round(ag.coverage * 100)}% of population` } : null;

      // ── urban ──
      const ur = regionalAgg(urbS, ri, mid, Math.max(window, 250), 0.5);
      cell.urban = ur ? { v: round(ur.v), src: "hyde_urban", lvl: "region", yr: ur.yr, note: `HYDE estimate, ${ur.n} countries` } : null;

      cell.conf = mid >= 1950 ? "high" : cell.e0.lvl === "region" && cell.q5.lvl === "region" ? "medium" : "low";
      cells.push(cell);
    }
  }

  // ── Geography for the globe ──
  const topo = JSON.parse(fs.readFileSync(P.worldAtlas, "utf8"));
  const feats = feature(topo, topo.objects.countries).features;
  const centroidByNum = new Map(feats.map((f) => [String(f.id).padStart(3, "0"), geoCentroid(f).map((x) => round(x, 2))]));
  for (const c of countries) c.centroid = centroidByNum.get(c.num) ?? null;
  const regionCentroid = byRegion.map((cs) => {
    const withC = cs.filter((c) => c.centroid);
    const biggest = withC.sort((a, b) => (interpLog(pop.get(b.iso3), 2000) ?? 0) - (interpLog(pop.get(a.iso3), 2000) ?? 0))[0];
    return biggest?.centroid ?? [0, 0];
  });
  for (const c of countries) if (!c.centroid) c.centroid = regionCentroid[c.region];

  const totalBirths = binsOut.reduce((s, b) => s + b.births, 0);
  const data = {
    version: 1,
    builtAt: new Date().toISOString().slice(0, 10),
    sources: SOURCES,
    regions: REGIONS.map((r, i) => ({ ...r, centroid: regionCentroid[i] })),
    countries: countries.map((c) => ({ iso3: c.iso3, num: c.num, name: c.name, region: c.region, centroid: c.centroid })),
    worldPop: worldPopS.filter(([y]) => y >= -10000).map(([y, v]) => [y, Math.round(v)]),
    bins: binsOut,
    totalBirths,
    cells,
  };
  const outDir = path.join(ROOT, "src/data/birth-lottery");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "data.json"), JSON.stringify(data));
  const pubDir = path.join(ROOT, "public/birth-lottery");
  fs.mkdirSync(pubDir, { recursive: true });
  fs.copyFileSync(P.worldAtlas, path.join(pubDir, "countries-110m.json"));

  console.log(`  bins ${binsOut.length}, regions ${REGIONS.length}, cells ${cells.length}, countries ${countries.length}`);
  console.log(`  total births 10,000 BCE → 2025 (PRB rates × HYDE population): ${(totalBirths / 1e9).toFixed(1)} billion`);
  const confCount = cells.reduce((m, c) => ((m[c.conf] = (m[c.conf] || 0) + 1), m), {});
  console.log("  cell confidence:", confCount);
  console.log(`  data.json ${(fs.statSync(path.join(outDir, "data.json")).size / 1024).toFixed(0)} KB`);

  // ── Sanity report: 10 cells vs raw sources ──
  const picks = [
    [-3000, "eastern-asia"],
    [1, "southern-europe"],
    [1347, "eastern-asia"],
    [1650, "western-europe"],
    [1820, "northern-europe"],
    [1870, "southern-asia"],
    [1900, "western-europe"],
    [1952, "western-africa"],
    [1980, "south-america"],
    [2015, "southern-asia"],
  ];
  let md = `# Birth Lottery — sanity check (${data.builtAt})\n\nEach row: what the app shows for a cell vs. the raw source value(s) it came from.\n\n`;
  md += "| Year (bin) | Region | Field | App value | Level | Raw source check |\n|---|---|---|---|---|---|\n";
  for (const [year, rid] of picks) {
    const bi = binsOut.findIndex((b) => year >= b.start && year < b.end);
    const ri = REGIONS.findIndex((r) => r.id === rid);
    const c = cells.find((x) => x.b === bi && x.r === ri);
    const b = binsOut[bi];
    const label = `${year} (${b.start}–${b.end})`;
    const regionCountries = byRegion[ri];
    const w = Math.min(Math.max((Math.min(b.end, 2025) - b.start) / 2, 10), 60);
    const raw = (S, field, src, win = w) => {
      const f = c[field];
      if (!f) return "no data → shown as 'No estimate'";
      if (f.lvl === "region" && src) {
        const vals = regionCountries
          .map((cc) => [cc.name, valueNear(S.get(cc.iso3), b.mid, win)])
          .filter(([, v]) => v)
          .slice(0, 4)
          .map(([n, v]) => `${n} ${round(v.v)} (${v.y})`);
        return vals.join("; ") || "(aggregate)";
      }
      if (f.lvl === "continent" || f.lvl === "world" || f.lvl === "standin") {
        const key = f.lvl === "world" || (f.lvl === "standin" && f.note.includes("world")) ? "World" : f.note.includes("Buringh") ? "Western Europe (Buringh and van Zanden)" : REGIONS[ri].continent;
        return `${key} @${f.yr}: ${round(interp(S.get(key), f.yr))}`;
      }
      return f.note || "";
    };
    if (b.mid >= 1950) {
      const t = tables.get(`${regionLoc[ri]}|${Math.min(b.mid, 2023)}`);
      md += `| ${label} | ${REGIONS[ri].name} | e0 | ${c.e0.v} | region | WPP ${REGIONS[ri].name} ${Math.min(b.mid, 2023)} ex(0) = ${round(t.ex[0])} |\n`;
      md += `| | | survive to 5 | ${round(100 - c.q5.v)}% | region | WPP l(5)/l(0) = ${round((t.lx[5] / t.lx[0]) * 100)}% |\n`;
    } else {
      md += `| ${label} | ${REGIONS[ri].name} | e0 | ${c.e0.v}${c.e0.range ? ` (range ${c.e0.range.join("–")})` : ""} | ${c.e0.lvl} | ${raw(e0S, "e0", true)} |\n`;
      md += `| | | child mortality <5 | ${c.q5.v}% | ${c.q5.lvl} | ${raw(q5S, "q5", true)} |\n`;
      md += `| | | (model fit) | e0 ${c.model.fitE0}, q5 ${c.model.fitQ5}% | model | standard ${c.model.std}, β=${c.model.beta}${c.model.exact ? "" : " (closest fit)"} |\n`;
    }
    md += `| | | literacy | ${c.lit ? c.lit.v + "%" : "—"} | ${c.lit?.lvl ?? "none"} | ${c.lit ? raw(litS, "lit", true) : "no data"} |\n`;
    md += `| | | urban | ${c.urban ? c.urban.v + "%" : "—"} | ${c.urban?.lvl ?? "none"} | ${c.urban ? raw(urbS, "urban", true, Math.max(w, 250)) : "no data"} |\n`;
  }
  fs.writeFileSync(path.join(ROOT, "scripts/birth-lottery/sanity-report.md"), md);
  console.log("  wrote sanity-report.md");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
