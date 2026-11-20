import type { Side } from "@/lib/choice-machine/predictor";
import { TOTAL, SEALED_INDEX } from "@/lib/choice-machine/protocol";

// Paper punch tape. Each column has two hole positions, left and right. Your row is punched as you
// choose. The machine's row stays under a brass shutter until the reveal; until then its
// predictions are not in the page at all.

function Cell({ v, k, kind }: { v: Side | undefined; k: number; kind: "you" | "machine" }) {
  return (
    <span className={`cm-cell ${k === SEALED_INDEX ? "is-sealed-col" : ""}`} data-v={v ?? ""}>
      <span className={`cm-hole ${v === 0 ? "is-punched" : ""}`} data-kind={kind} />
      <span className={`cm-hole ${v === 1 ? "is-punched" : ""}`} data-kind={kind} />
    </span>
  );
}

export default function Tape({
  choices,
  predictions,
  current,
}: {
  choices: Side[];
  /** null until the reveal */
  predictions: Side[] | null;
  current: number;
}) {
  const cols = Array.from({ length: TOTAL }, (_, k) => k);
  return (
    <div className={`cm-tape ${predictions ? "is-open" : ""}`}>
      <div className="cm-tape-paper">
        <div className="cm-tape-row">
          <span className="cm-tape-label">You</span>
          <div className="cm-tape-cells">
            {cols.map((k) => (
              <span key={k} className={`cm-col ${k === current ? "is-current" : ""} ${predictions && predictions[k] === choices[k] ? "is-match" : ""}`}>
                <Cell v={choices[k]} k={k} kind="you" />
              </span>
            ))}
          </div>
        </div>
        <div className="cm-tape-row cm-tape-row--machine">
          <span className="cm-tape-label">Machine</span>
          <div className="cm-tape-cells">
            {cols.map((k) => (
              <span
                key={k}
                className={`cm-col ${predictions && predictions[k] === choices[k] ? "is-match" : ""}`}
                style={{ "--i": k } as React.CSSProperties}
              >
                <Cell v={predictions ? predictions[k] : undefined} k={k} kind="machine" />
              </span>
            ))}
          </div>
          <div className="cm-shutter" aria-hidden="true">
            <span>Predictions sealed</span>
          </div>
        </div>
        <div className="cm-tape-nums" aria-hidden="true">
          <span className="cm-tape-label" />
          <div className="cm-tape-cells">
            {cols.map((k) => (
              <span key={k} className="cm-col">
                {k === SEALED_INDEX ? "XI" : k + 1}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="visually-hidden">
        {choices.length} of {TOTAL} choices made: {choices.map((c) => (c ? "right" : "left")).join(", ")}.
      </p>
    </div>
  );
}
