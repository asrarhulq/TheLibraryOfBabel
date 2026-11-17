"use client";

import { useState } from "react";
import type { Answers, ServerResult } from "./Missed";
import { CHALLENGE_TEXT, resultText } from "./text";

export default function Share({ id, answers, server, seconds }: { id: string; answers: Answers; server: ServerResult; seconds: number }) {
  const [note, setNote] = useState("");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const path = `/missed/r/${id}`;
  const text = resultText(answers.countAnswer, server.identified, seconds);

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
    <section className="ms-sec ms-share" aria-labelledby="ms-share-title">
      <h2 id="ms-share-title" className="serif ms-h2">
        Share
      </h2>
      <p className="ms-share-text">&ldquo;{text}&rdquo;</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ms-share-img" src={`${path}/card`} alt={text} width={1200} height={630} loading="lazy" />
      <div className="ms-share-actions">
        <button className="ms-btn ms-btn--primary" onClick={() => send(CHALLENGE_TEXT, `${origin}/missed`, "Challenge copied — it doesn’t give anything away.")}>
          Challenge a friend
        </button>
        <button className="ms-btn" onClick={() => send(text, `${origin}${path}`, "Result link copied.")}>
          Share my result
        </button>
        <a className="ms-btn" href={`${path}/card`} download={`the-thing-you-missed-${id}.png`}>
          Download image
        </a>
      </div>
      <p className="ms-dim" role="status">
        {note || "“Challenge a friend” links to the test without spoiling it. Your result link does reveal the surprise."}
      </p>
    </section>
  );
}
