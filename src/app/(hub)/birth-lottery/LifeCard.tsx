import type { Field, RollResult } from "@/lib/birth-lottery/types";
import { compactNumber } from "@/lib/birth-lottery/format";

const LEVEL_LABEL: Record<string, string> = {
  region: "Regional data",
  continent: "Continental estimate",
  world: "World average",
  standin: "Stand-in",
  model: "Modelled",
  fact: "Historical fact",
  none: "No estimate",
};

const CONF_TEXT = {
  high: "UN life tables for this region and year.",
  medium: "Regional historical records.",
  low: "Few or no records for this time and place, so these are rough estimates (see notes).",
};

function Tag({ f }: { f: Field }) {
  return (
    <span className={`bl-tag bl-tag--${f.contextOnly ? "none" : f.level}`} title={f.note}>
      {f.contextOnly ? "No regional estimate" : LEVEL_LABEL[f.level]}
    </span>
  );
}

const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v)}%`);
const rng = (f: Field, unit = "") => (f.range ? ` (range ${Math.round(f.range[0])}–${Math.round(f.range[1])}${unit})` : "");

export default function LifeCard({ r }: { r: RollResult }) {
  const s = r.stats;
  const survival = [
    { label: "Reach age 1", f: s.survive1 },
    { label: "Reach age 5", f: s.survive5 },
    { label: "Reach age 15", f: s.survive15 },
  ];
  const max = 85;
  return (
    <article className="bl-card" aria-labelledby="bl-card-title">
      <header className="bl-card-head">
        <div>
          <p className="bl-card-kicker">Your life card · {r.bin.label}</p>
          <h2 id="bl-card-title" className="serif bl-card-year">
            {r.yearLabel}
          </h2>
          <p className="bl-card-place">
            <strong>{r.region.name}</strong>
            <span> · around present-day {r.country.name}</span>
          </p>
        </div>
        <span className={`bl-conf bl-conf--${r.confidence}`} title={CONF_TEXT[r.confidence]}>
          {r.confidence === "high" ? "High" : r.confidence === "medium" ? "Medium" : "Low"} confidence
        </span>
      </header>

      <p className="bl-card-pop">
        One of about <strong>{compactNumber(r.worldPop)}</strong> people alive in the world that year.
      </p>

      <section className="bl-card-sec" aria-label="Chance of surviving childhood">
        <h3>Chance of surviving</h3>
        <ul className="bl-surv">
          {survival.map(({ label, f }) => (
            <li key={label}>
              <span className="bl-surv-label">{label}</span>
              <span className="bl-surv-track" aria-hidden="true">
                <span style={{ "--w": (f.value ?? 0) / 100 } as React.CSSProperties} />
              </span>
              <span className="bl-surv-val">
                {pct(f.value)}
                {f.range && <small>{rng(f, "%")}</small>}
              </span>
              <Tag f={f} />
            </li>
          ))}
        </ul>
      </section>

      <section className="bl-card-sec" aria-label="Life expectancy">
        <h3>How long people lived</h3>
        <div className="bl-le">
          <div className="bl-le-row">
            <span className="bl-le-label">Average at birth</span>
            <span className="bl-le-track" aria-hidden="true">
              {s.e0.range && (
                <span
                  className="bl-le-range"
                  style={{ left: `${(s.e0.range[0] / max) * 100}%`, width: `${((s.e0.range[1] - s.e0.range[0]) / max) * 100}%` }}
                />
              )}
              <span className="bl-le-bar bl-le-bar--birth" style={{ "--w": (s.e0.value ?? 0) / max } as React.CSSProperties} />
            </span>
            <span className="bl-le-val serif">{s.e0.value != null ? Math.round(s.e0.value) : "—"}</span>
            <Tag f={s.e0} />
          </div>
          <div className="bl-le-row">
            <span className="bl-le-label">If you reached 15</span>
            <span className="bl-le-track" aria-hidden="true">
              <span className="bl-le-bar bl-le-bar--adult" style={{ "--w": (s.e15.value ?? 0) / max } as React.CSSProperties} />
            </span>
            <span className="bl-le-val serif">{s.e15.value != null ? Math.round(s.e15.value) : "—"}</span>
            <Tag f={s.e15} />
          </div>
          <p className="bl-le-note">
            {s.e0.range ? `Range of regional estimates: ${Math.round(s.e0.range[0])}–${Math.round(s.e0.range[1])} years. ` : ""}
            Low averages were mostly children dying young — adults often lived much longer.
          </p>
        </div>
      </section>

      <section className="bl-card-sec bl-tiles" aria-label="Daily life">
        {[
          { label: "Could read", f: s.literacy },
          { label: "Worked the land", f: s.agriculture },
          { label: "Lived in towns", f: s.urban },
        ].map(({ label, f }) => (
          <div key={label} className="bl-tile">
            <span className="serif bl-tile-val">{f.contextOnly ? "—" : pct(f.value)}</span>
            <span className="bl-tile-label">{label}</span>
            <Tag f={f} />
            <small className="bl-tile-note">{f.note}</small>
          </div>
        ))}
      </section>

      <p className="bl-card-sentence serif">{r.sentence}</p>

      <details className="bl-card-notes">
        <summary>Where these numbers come from</summary>
        <ul>
          {(
            [
              ["Reach age 1", s.survive1],
              ["Reach age 5", s.survive5],
              ["Reach age 15", s.survive15],
              ["Life expectancy at birth", s.e0],
              ["Expected age if you reached 15", s.e15],
              ["Literacy", s.literacy],
              ["Agriculture", s.agriculture],
              ["Urban share", s.urban],
            ] as [string, Field][]
          ).map(([k, f]) => (
            <li key={k}>
              <strong>{k}:</strong> {f.note}
              {f.range ? ` — range ${f.range[0]}–${f.range[1]}` : ""}
            </li>
          ))}
          {r.model && (
            <li>
              <strong>Age pattern:</strong> Brass logit fit to the UN life table of {r.model.standard}
              {r.model.exact ? "" : " (closest possible fit)"}.
            </li>
          )}
        </ul>
      </details>
    </article>
  );
}
