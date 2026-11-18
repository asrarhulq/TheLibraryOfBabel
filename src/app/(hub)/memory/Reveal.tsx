"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DRM_LISTS, summarize, type LureResult, type TestResponse } from "@/lib/memory/drm";
import AssociationMap from "./AssociationMap";
import { renderShareCard } from "./shareCard";

interface Stats {
  totalRuns: number;
  lures: Record<string, { falseRecallPct: number; avgConfidence: number | null }>;
  avgFalseRecalls: number;
  avgHitRate: number;
  avgControlFalseAlarmRate: number;
  distribution: number[];
}

// Below this many runs, crowd percentages are too noisy to show.
const MIN_RUNS_FOR_CROWD = 5;

const pct = (x: number) => `${Math.round(x * 100)}%`;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export default function Reveal({
  sessionId,
  responses,
  onRestart,
}: {
  sessionId: string;
  responses: TestResponse[];
  onRestart: () => void;
}) {
  const summary = useMemo(() => summarize(responses), [responses]);
  const [stage, setStage] = useState<"pause" | "results">("pause");
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsState, setStatsState] = useState<"loading" | "ok" | "error">("loading");

  // Save the run, then pull the crowd numbers.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetch("/api/memory/run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId, responses }),
          keepalive: true,
        });
      } catch {
        /* saving is best-effort; the reveal works without it */
      }
      try {
        const r = await fetch("/api/memory/stats");
        if (!r.ok) throw new Error(String(r.status));
        const s = (await r.json()) as Stats;
        if (!cancelled) {
          setStats(s);
          setStatsState("ok");
        }
      } catch {
        if (!cancelled) setStatsState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, responses]);

  useEffect(() => {
    const t = setTimeout(() => setStage("results"), prefersReducedMotion() ? 900 : 2600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (stage === "results") window.scrollTo({ top: 0 });
  }, [stage]);

  if (stage === "pause") {
    return (
      <section className="mem-stage" aria-live="polite">
        <p className="serif rv-pause">Let&rsquo;s check your memory.</p>
      </section>
    );
  }

  const crowdReady = !!stats && stats.totalRuns >= MIN_RUNS_FOR_CROWD;
  // Fooled lures first — that's the story.
  const ordered = [...summary.lures].sort((a, b) => Number(b.falselyRecalled) - Number(a.falselyRecalled));
  const n = summary.falseRecallCount;
  const lureRate = n / summary.lures.length;

  return (
    <div className="rv" aria-live="polite">
      <section className="rv-hero">
        <p className="mem-kicker rv-fade" style={{ "--d": "0ms" } as React.CSSProperties}>
          Results · the DRM false-memory effect
        </p>
        <h1 className="serif rv-score rv-fade" style={{ "--d": "150ms" } as React.CSSProperties}>
          {n === 0 ? (
            <>No false memories this time.</>
          ) : (
            <>
              You remembered <em>{n}</em> {n === 1 ? "word" : "words"} you never saw.
            </>
          )}
        </h1>
        <p className="rv-sub rv-fade" style={{ "--d": "400ms" } as React.CSSProperties}>
          {n === 0
            ? "Five of the test words never appeared on any list. You turned all five down. Most people don’t."
            : `Five words in the test never appeared in any list. ${n === 5 ? "You said you’d seen all five." : `You said you’d seen ${n} of them.`}`}
        </p>

        <div className="rv-tokens rv-fade" style={{ "--d": "600ms" } as React.CSSProperties} aria-hidden="true">
          {ordered.map((l) => (
            <span key={l.lure} className={`rv-token ${l.falselyRecalled ? "is-fooled" : ""}`} />
          ))}
        </div>

        <Bars hit={summary.realHitRate} lure={lureRate} ctrl={summary.controlFalseAlarmRate} />

        {crowdReady && (
          <p className="rv-crowd-line rv-fade" style={{ "--d": "1300ms" } as React.CSSProperties}>
            Across {stats!.totalRuns.toLocaleString()} runs, people falsely remembered{" "}
            <strong>{stats!.avgFalseRecalls.toFixed(1)}</strong> of 5 on average.
          </p>
        )}
      </section>

      <section className="rv-lures" aria-label="Each planted word">
        {ordered.map((l, i) => (
          <LureCard key={l.lure} r={l} index={i} stats={stats} crowdReady={crowdReady} statsState={statsState} />
        ))}
      </section>

      <section className="rv-explain">
        <h2 className="serif">What happened</h2>
        <p>
          Memory keeps the gist of things rather than a recording. Reading <em>bed, rest, tired, dream, snooze…</em>, you didn&rsquo;t
          store fifteen separate words. You stored the fact that the list was about sleep, and each word also nudged the word
          &ldquo;sleep&rdquo; itself. By the test, &ldquo;sleep&rdquo; felt as familiar as the words you had actually read, and that
          familiarity is most of what &ldquo;I saw it&rdquo; is based on.
        </p>
        <p>
          This is the Deese–Roediger–McDermott (DRM) effect, one of the most replicated findings in memory research (Roediger &amp;
          McDermott, 1995, building on Deese, 1959). Keeping meaning instead of exact detail is efficient, and most of the time
          it&rsquo;s right. It also means that being sure you remember something isn&rsquo;t evidence that it happened, which
          matters for eyewitness testimony and for arguments about who said what.
        </p>
      </section>

      <ShareBlock fooled={ordered.map((l) => l.falselyRecalled)} hitRate={summary.realHitRate} n={n} />

      <div className="rv-actions">
        <button className="mem-btn mem-btn--primary" onClick={onRestart}>
          Try another set
        </button>
        <Link className="mem-btn" href="/">
          Back to the library
        </Link>
      </div>
      <p className="rv-fine">
        Not a clinical test. Your answers were saved anonymously: a random id and your scores, nothing else.
      </p>
    </div>
  );
}

// ── Bars: real words vs planted words vs unrelated words ────────────────────

function Bars({ hit, lure, ctrl }: { hit: number; lure: number; ctrl: number }) {
  const rows = [
    { label: "Real words you saw", sub: "you said “I saw this”", v: hit, cls: "real" },
    { label: "Planted related words", sub: "never shown, but you said yes", v: lure, cls: "lure" },
    { label: "Unrelated words", sub: "never shown, but you said yes", v: ctrl, cls: "ctrl" },
  ];
  return (
    <div className="rv-bars rv-fade" style={{ "--d": "800ms" } as React.CSSProperties}>
      {rows.map((r, i) => (
        <div key={r.cls} className={`rv-bar rv-bar--${r.cls}`}>
          <div className="rv-bar-label">
            <span>{r.label}</span>
            <small>{r.sub}</small>
          </div>
          <div className="rv-bar-track" aria-hidden="true">
            <span style={{ "--w": r.v, "--d": `${1000 + i * 180}ms` } as React.CSSProperties} />
          </div>
          <span className="rv-bar-val">{pct(r.v)}</span>
        </div>
      ))}
    </div>
  );
}

// ── One lure ────────────────────────────────────────────────────────────────

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);
  return [ref, inView] as const;
}

function LureCard({
  r,
  index,
  stats,
  crowdReady,
  statsState,
}: {
  r: LureResult;
  index: number;
  stats: Stats | null;
  crowdReady: boolean;
  statsState: "loading" | "ok" | "error";
}) {
  const [ref, inView] = useInView<HTMLElement>();
  const crowd = stats?.lures[r.lure];
  const sample = DRM_LISTS[r.lure].slice(0, 3).join(", ");

  return (
    <article ref={ref} className={`rv-lure ${r.falselyRecalled ? "is-fooled" : "is-held"} ${inView ? "is-in" : ""}`}>
      <div className="rv-lure-text">
        <p className="rv-lure-n">Planted word {index + 1} of 5</p>
        <h3 className="serif rv-lure-word">&ldquo;{r.lure}&rdquo;</h3>
        <p className={`rv-verdict ${r.falselyRecalled ? "is-fooled" : "is-held"}`}>{r.falselyRecalled ? "False memory" : "Correctly rejected"}</p>
        <p className="rv-lure-line">
          {r.falselyRecalled ? (
            <>
              You were <strong>{r.confidence}/5 sure</strong> you saw &lsquo;{r.lure}&rsquo;. <strong>You never did.</strong>
            </>
          ) : (
            <>
              You said you hadn&rsquo;t seen &lsquo;{r.lure}&rsquo; ({r.confidence}/5 sure). <strong>Correct.</strong>
            </>
          )}
        </p>
        <p className="rv-lure-why">
          The list had <em>{sample}</em> and twelve other words closely linked to it.
        </p>
        <p className="rv-lure-crowd">
          {crowdReady && crowd ? (
            r.falselyRecalled ? (
              <>
                <strong>{crowd.falseRecallPct}%</strong> of people also &ldquo;remembered&rdquo; &lsquo;{r.lure}&rsquo;.
              </>
            ) : (
              <>
                <strong>{crowd.falseRecallPct}%</strong> of people said they&rsquo;d seen this one.
              </>
            )
          ) : statsState === "loading" ? (
            <span className="rv-dim">Loading other people&rsquo;s results…</span>
          ) : statsState === "error" ? (
            <span className="rv-dim">Couldn&rsquo;t load everyone else&rsquo;s results right now.</span>
          ) : (
            <span className="rv-dim">Not enough runs yet to compare with other people.</span>
          )}
        </p>
      </div>
      <div className="rv-lure-map">
        <AssociationMap lure={r.lure} fooled={r.falselyRecalled} />
      </div>
    </article>
  );
}

// ── Share ───────────────────────────────────────────────────────────────────

function ShareBlock({ fooled, hitRate, n }: { fooled: boolean[]; hitRate: number; n: number }) {
  const [img, setImg] = useState<{ url: string; blob: Blob } | null>(null);
  const [note, setNote] = useState("");
  const link = typeof window !== "undefined" ? `${window.location.origin}/memory` : "https://thelibrary.page/memory";
  const text =
    n === 0
      ? "0 of 5 false memories on Memory That Lies. Try it:"
      : `I remembered ${n} of 5 words I never saw on Memory That Lies. Try it:`;

  useEffect(() => {
    let url = "";
    let alive = true;
    const probe = document.querySelector(".serif");
    const family = probe ? getComputedStyle(probe).fontFamily.split(",")[0] : "Georgia";
    renderShareCard({ fooled, hitRate, url: link }, family).then((blob) => {
      if (!alive || !blob) return;
      url = URL.createObjectURL(blob);
      setImg({ url, blob });
    });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const share = async () => {
    const file = img ? new File([img.blob], "memory-that-lies.png", { type: "image/png" }) : null;
    try {
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ text: `${text} ${link}`, files: [file] });
      } else if (navigator.share) {
        await navigator.share({ text, url: link });
      } else {
        await navigator.clipboard.writeText(`${text} ${link}`);
        setNote("Copied to clipboard.");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setNote("Sharing didn’t work. Try downloading the image.");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${link}`);
      setNote("Copied to clipboard.");
    } catch {
      setNote(link);
    }
  };

  return (
    <section className="rv-share">
      <h2 className="serif">Send it to someone</h2>
      <div className="rv-share-card">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img.url} alt={text} width={1200} height={630} />
        ) : (
          <div className="rv-share-ph" aria-hidden="true" />
        )}
      </div>
      <div className="rv-share-actions">
        <button className="mem-btn" onClick={share}>
          Share
        </button>
        {img && (
          <a className="mem-btn" href={img.url} download="memory-that-lies.png">
            Download image
          </a>
        )}
        <button className="mem-btn" onClick={copy}>
          Copy link
        </button>
      </div>
      <p className="rv-dim" role="status">
        {note || "The image doesn’t show the planted words, so it won’t give anything away."}
      </p>
    </section>
  );
}
