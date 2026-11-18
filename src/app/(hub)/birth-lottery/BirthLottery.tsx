"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Globe from "./Globe";
import LifeCard from "./LifeCard";
import LiveThisLife from "./LiveThisLife";
import { MIN_YEAR, maxYear, yearLabel } from "@/lib/birth-lottery/format";
import type { RollResult } from "@/lib/birth-lottery/types";

type Phase = "intro" | "rolling" | "landing" | "result";

interface Stats {
  totalRolls: number;
  diedBefore5Pct: number;
  reached80Pct: number;
  bornAfter1950Pct: number;
  bornInAsiaPct: number;
}

const MIN_SPIN_MS = 1100;

export default function BirthLottery({ initial }: { initial: RollResult | null }) {
  const [phase, setPhase] = useState<Phase>(initial ? "landing" : "intro");
  const [result, setResult] = useState<RollResult | null>(initial);
  const [error, setError] = useState("");
  const [yearText, setYearText] = useState("");
  const [era, setEra] = useState<"CE" | "BCE">("CE");
  const [stats, setStats] = useState<Stats | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const loadStats = () =>
    fetch("/api/birth-lottery/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setStats(s))
      .catch(() => {});
  useEffect(() => {
    loadStats();
  }, []);

  async function roll(mode: "random" | "year") {
    setError("");
    let year: number | undefined;
    if (mode === "year") {
      const n = Number(yearText.trim());
      year = era === "BCE" ? -n : n;
      if (!Number.isInteger(n) || n <= 0 || year < MIN_YEAR || year > maxYear()) {
        setError(`Enter a year between 10,000 BCE and ${maxYear()}.`);
        return;
      }
    }
    setPhase("rolling");
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const t0 = performance.now();
    try {
      const res = await fetch("/api/birth-lottery/roll", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mode === "year" ? { mode, year } : { mode }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not roll");
      const wait = MIN_SPIN_MS - (performance.now() - t0);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      setResult(j as RollResult);
      setPhase("landing");
      window.history.pushState(null, "", `/birth-lottery/r/${j.seed}`);
    } catch (e) {
      setError((e as Error).message);
      setPhase("intro");
    }
  }

  const onLanded = () => {
    setPhase((p) => (p === "landing" ? "result" : p));
    loadStats();
  };

  useEffect(() => {
    if (phase === "result") resultRef.current?.focus({ preventScroll: true });
  }, [phase]);

  const showGlobe = phase !== "intro";

  return (
    <div className={`bl ${phase === "intro" ? "bl--intro" : ""}`}>
      {phase === "intro" && (
        <section className="bl-intro bl-fade">
          <p className="bl-kicker">Inequality of opportunity</p>
          <h1 className="serif bl-title">The Birth Lottery</h1>
          <p className="serif bl-fact">
            About <strong>117 billion</strong> humans have ever been born.
            <br />
            This picks one of them at random.
          </p>
          <p className="bl-source">
            Estimate:{" "}
            <a href="https://www.prb.org/articles/how-many-people-have-ever-lived-on-earth/" target="_blank" rel="noreferrer">
              Population Reference Bureau (Kaneda &amp; Haub, 2022)
            </a>
          </p>

          <div className="bl-modes">
            <button className="bl-btn bl-btn--primary" onClick={() => roll("random")} autoFocus>
              Pick someone at random
            </button>
            <form
              className="bl-year"
              onSubmit={(e) => {
                e.preventDefault();
                roll("year");
              }}
            >
              <label htmlFor="bl-year-input">Or pick a birth year</label>
              <div className="bl-year-row">
                <input
                  id="bl-year-input"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 1347"
                  value={yearText}
                  onChange={(e) => setYearText(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                />
                <div className="bl-era" role="group" aria-label="Era">
                  {(["CE", "BCE"] as const).map((x) => (
                    <button type="button" key={x} aria-pressed={era === x} onClick={() => setEra(x)}>
                      {x}
                    </button>
                  ))}
                </div>
                <button className="bl-btn" type="submit" disabled={!yearText}>
                  Roll
                </button>
              </div>
            </form>
          </div>
          {error && (
            <p className="bl-error" role="alert">
              {error}
            </p>
          )}
          <p className="bl-honest">
            Built from historical estimates. It&rsquo;s an illustration, not a prediction, and it has nothing to do with
            anyone&rsquo;s ancestry: only time, place and living conditions.
          </p>
        </section>
      )}

      {showGlobe && (
        <div className={`bl-stage ${phase === "result" ? "is-result" : ""}`}>
          <div className="bl-globe-wrap">
            <Globe
              target={result ? result.country.centroid : null}
              spinning={phase === "rolling"}
              highlight={result?.regionCountryNums ?? []}
              focusNum={result?.country.num ?? null}
              label={result ? `Globe with a pin in ${result.region.name}, around present-day ${result.country.name}` : "Spinning globe"}
              onLanded={onLanded}
            />
            <p className="bl-globe-cap" aria-live="polite">
              {phase === "rolling" && "Rolling…"}
              {phase !== "rolling" && result && (
                <>
                  <span className="serif">{result.yearLabel}</span> · {result.region.name}
                  <small>approximate region · present-day borders</small>
                </>
              )}
            </p>
          </div>

          {phase === "result" && result && (
            <div className="bl-result bl-fade" ref={resultRef} tabIndex={-1}>
              <LifeCard r={result} />
            </div>
          )}
        </div>
      )}

      {phase === "result" && result && (
        <>
          <LiveThisLife key={result.seed} r={result} />
          <Share r={result} />
          <div className="bl-again">
            <button className="bl-btn bl-btn--primary" onClick={() => roll("random")}>
              Pick another person
            </button>
            <button
              className="bl-btn"
              onClick={() => {
                setPhase("intro");
                setResult(null);
                window.history.pushState(null, "", "/birth-lottery");
              }}
            >
              Pick a year
            </button>
            <Link className="bl-btn" href="/">
              Back to the library
            </Link>
          </div>
        </>
      )}

      {stats && stats.totalRolls >= 10 && (
        <aside className="bl-stats" aria-label="All rolls so far">
          <p>
            <strong>{stats.totalRolls.toLocaleString()}</strong> rolls so far
          </p>
          <p>
            <strong>{Math.round(stats.diedBefore5Pct)}%</strong> died before age 5
          </p>
          <p>
            <strong>{Math.round(stats.bornInAsiaPct)}%</strong> were born in Asia
          </p>
          <p>
            only <strong>{Math.round(stats.bornAfter1950Pct)}%</strong> were born after 1950
          </p>
        </aside>
      )}

      <Sources r={result} />
    </div>
  );
}

function Share({ r }: { r: RollResult }) {
  const [note, setNote] = useState("");
  const path = `/birth-lottery/r/${r.seed}`;
  const imgPath = `${path}/card`;
  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ text: r.shareText, url });
      else {
        await navigator.clipboard.writeText(`${r.shareText} ${url}`);
        setNote("Copied to clipboard.");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setNote("Sharing didn’t work. Copy the link instead.");
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setNote("Link copied. It always opens this exact roll.");
    } catch {
      setNote(url);
    }
  };

  return (
    <section className="bl-share" aria-labelledby="bl-share-title">
      <h2 id="bl-share-title" className="serif">
        Share this one
      </h2>
      <p className="bl-share-text">&ldquo;{r.shareText}&rdquo;</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bl-share-img" src={imgPath} alt={r.shareText} width={1200} height={630} loading="lazy" />
      <div className="bl-share-actions">
        <button className="bl-btn" onClick={share}>
          Share
        </button>
        <button className="bl-btn" onClick={copy}>
          Copy link
        </button>
        <a className="bl-btn" href={imgPath} download={`birth-lottery-${r.seed}.png`}>
          Download image
        </a>
      </div>
      <p className="bl-dim" role="status">
        {note || "The link reproduces this exact roll for anyone who opens it."}
      </p>
    </section>
  );
}

function Sources({ r }: { r: RollResult | null }) {
  return (
    <details className="bl-sources">
      <summary>Sources and methods</summary>
      <div className="bl-sources-body">
        <p>
          Everything here is an illustration built from historical estimates. It is not a prediction and says nothing about
          anyone&rsquo;s ancestry: the roll picks a time, an approximate region (present-day borders) and the conditions
          recorded or estimated there — never ethnicity, religion or race.
        </p>
        <ul>
          <li>
            <strong>Who gets rolled.</strong> Random humans are weighted by how many people were born in each era (PRB birth
            rates × HYDE population), then by each region&rsquo;s population. That is why most rolls land in farming
            societies in Asia: that is where most people have lived.
          </li>
          <li>
            <strong>1950 onwards</strong> uses UN life tables for the region and year (High confidence).
          </li>
          <li>
            <strong>Before 1950</strong>, life expectancy and child mortality come from long-run series (Riley, Gapminder,
            HMD). When a region has no record, a continental or world average — or the earliest estimate available — stands in,
            and the card says so. Survival to 1 and 15 comes from a UN life-table age pattern fitted to those numbers (Brass
            logit model).
          </li>
          <li>
            <strong>Literacy and farm work</strong> are shown only where estimates exist. Before about 1800, almost no
            region has them.
          </li>
          <li>
            <strong>Your outcome</strong> is a single draw from the survival curve, fixed by the seed in the link.
          </li>
        </ul>
        <h3>Datasets</h3>
        <ul className="bl-src-list">
          {(r?.sources ?? DEFAULT_SOURCES).map((s) => (
            <li key={s.name}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.name}
              </a>{" "}
              — {s.by} ({s.license})
            </li>
          ))}
        </ul>
        <p className="bl-dim">
          Data years: births 10,000 BCE–{yearLabel(maxYear())}. Full method notes ship with the code in DATA_SOURCES.md.
        </p>
      </div>
    </details>
  );
}

const DEFAULT_SOURCES = [
  { name: "How Many People Have Ever Lived on Earth? (Kaneda & Haub, 2022)", by: "Population Reference Bureau", url: "https://www.prb.org/articles/how-many-people-have-ever-lived-on-earth/", license: "cited figures" },
  { name: "Population — HYDE 3.3, Gapminder, UN WPP", by: "Our World in Data", url: "https://ourworldindata.org/grapher/population", license: "CC BY 4.0" },
  { name: "World Population Prospects 2024, life tables", by: "UN DESA Population Division", url: "https://population.un.org/wpp/downloads", license: "CC BY 3.0 IGO" },
  { name: "Life expectancy, long-run (Riley; Zijdeman et al.; HMD; UN WPP)", by: "Our World in Data", url: "https://ourworldindata.org/grapher/life-expectancy", license: "CC BY 4.0" },
  { name: "Child mortality, long-run (Gapminder; UN IGME)", by: "Our World in Data", url: "https://ourworldindata.org/grapher/child-mortality", license: "CC BY 4.0" },
  { name: "Literacy rate (Buringh & van Zanden; van Zanden et al.; UNESCO)", by: "Our World in Data", url: "https://ourworldindata.org/grapher/cross-country-literacy-rates", license: "CC BY 4.0" },
  { name: "Share of employment in agriculture (ILO; Broadberry & Gardner)", by: "Our World in Data", url: "https://ourworldindata.org/grapher/share-of-employment-in-agriculture", license: "CC BY 4.0" },
  { name: "Urban population share (HYDE 3.5)", by: "Our World in Data", url: "https://ourworldindata.org/grapher/long-term-urban-population-region", license: "CC BY 4.0" },
  { name: "Natural Earth country shapes (world-atlas)", by: "Natural Earth", url: "https://github.com/topojson/world-atlas", license: "public domain" },
];
