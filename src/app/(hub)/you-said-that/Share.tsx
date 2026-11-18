"use client";

import { useState } from "react";
import { CHALLENGE_TEXT, shareHeadline, type Totals } from "@/lib/you-said-that/protocol";

export default function Share({ id, seed, totals }: { id: string | null; seed: string; totals: Totals }) {
  const [note, setNote] = useState("");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const text = shareHeadline(totals);
  const path = id ? `/you-said-that/r/${id}` : null;

  const send = async (t: string, url: string, ok: string) => {
    try {
      if (navigator.share) await navigator.share({ text: t, url });
      else {
        await navigator.clipboard.writeText(`${t} ${url}`);
        setNote(ok);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setNote(url);
    }
  };

  return (
    <section className="yst-sec yst-share" aria-labelledby="yst-share-h">
      <h2 id="yst-share-h" className="serif yst-h2">
        Share
      </h2>
      <p className="yst-share-text">&ldquo;{text}&rdquo;</p>
      {path && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="yst-share-img" src={`${path}/card`} alt={`Result card: ${text}`} width={1200} height={630} loading="lazy" />
      )}
      <div className="yst-share-actions">
        <button
          className="yst-btn yst-btn--primary"
          onClick={() => send(CHALLENGE_TEXT, `${origin}/you-said-that?s=${seed}`, "Link copied. Its preview gives nothing away.")}
        >
          Try the trick on a friend
        </button>
        {path && (
          <>
            <button className="yst-btn" onClick={() => send(text, `${origin}${path}`, "Result link copied.")}>
              Share my result
            </button>
            <a className="yst-btn" href={`${path}/card`} download={`you-said-that-${id}.png`}>
              Download image
            </a>
          </>
        )}
      </div>
      <p className="yst-dim" role="status">
        {note ||
          "“Try the trick on a friend” sends them the same pieces you saw, with a neutral preview, so you can compare afterwards. Your result link does reveal the trick."}
      </p>
    </section>
  );
}
