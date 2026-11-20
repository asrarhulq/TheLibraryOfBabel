import { SIDE_NAME, type Side } from "@/lib/choice-machine/predictor";

// The sealed prediction. While sealed, the card shows only its back and a wax seal stamped with the
// first characters of the SHA-256 commitment. The predicted side is not rendered until it opens.

export type SealState = "printing" | "sealed" | "open";

export default function SealCard({ state, hash, side }: { state: SealState; hash: string; side: Side | null }) {
  const short = hash ? `${hash.slice(0, 4)} ${hash.slice(4, 8)} ${hash.slice(8, 12)}` : "····";
  return (
    <div className="cm-seal" data-state={state}>
      <div className="cm-seal-card">
        <div className="cm-seal-face cm-seal-back">
          <span className="cm-seal-kicker">Prediction № XI</span>
          <span className="cm-seal-guilloche" aria-hidden="true" />
          <span className="cm-seal-hash">seal {short}</span>
        </div>
        <div className="cm-seal-face cm-seal-front">
          <span className="cm-seal-kicker">The machine predicted</span>
          {side !== null && (
            <span className="cm-seal-word serif">
              {side === 0 ? "← " : ""}
              {SIDE_NAME[side]}
              {side === 1 ? " →" : ""}
            </span>
          )}
          <span className="cm-seal-hash">seal {short}</span>
        </div>
      </div>
      <div className="cm-wax" aria-hidden="true">
        <span className="cm-wax-half cm-wax-half--l" />
        <span className="cm-wax-half cm-wax-half--r" />
        <span className="cm-wax-mark">◉</span>
      </div>
    </div>
  );
}
