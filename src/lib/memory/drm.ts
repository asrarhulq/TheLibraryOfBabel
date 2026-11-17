// Deese–Roediger–McDermott (DRM) materials for "Memory That Lies".
// Shared by the browser experience and the API (pure data + helpers, no DOM / no DB).
//
// Lists are the standard DRM lists (Roediger & McDermott, 1995; norms in Stadler,
// Roediger & McDermott, 1999), in descending order of backward associative strength.
// The critical lure itself is NEVER shown during study.

export type Lure = "sleep" | "needle" | "chair" | "doctor" | "mountain";

export const DRM_LISTS: Record<Lure, readonly string[]> = {
  sleep: ["bed", "rest", "awake", "tired", "dream", "wake", "snooze", "blanket", "doze", "slumber", "snore", "nap", "peace", "yawn", "drowsy"],
  needle: ["thread", "pin", "eye", "sewing", "sharp", "point", "prick", "thimble", "haystack", "thorn", "hurt", "injection", "syringe", "cloth", "knitting"],
  chair: ["table", "sit", "legs", "seat", "couch", "desk", "recliner", "sofa", "wood", "cushion", "swivel", "stool", "sitting", "rocking", "bench"],
  doctor: ["nurse", "sick", "lawyer", "medicine", "health", "hospital", "dentist", "physician", "ill", "patient", "office", "stethoscope", "surgeon", "clinic", "cure"],
  mountain: ["hill", "valley", "climb", "summit", "top", "molehill", "peak", "plain", "glacier", "goat", "bike", "climber", "range", "steep", "ski"],
};

export const LURES = Object.keys(DRM_LISTS) as Lure[];

// Unrelated control words: chosen to have no obvious association with any list or lure
// (e.g. avoiding "button"→sewing, "ladder"→climb, "river"→valley, "carpet"→furniture).
export const CONTROL_WORDS = ["pencil", "orange", "candle", "violin", "bread", "umbrella", "kettle", "mirror", "onion", "planet"] as const;

export const STUDIED_PER_LIST_IN_TEST = 3;

const STUDIED_SET = new Set(Object.values(DRM_LISTS).flat());
const CONTROL_SET = new Set<string>(CONTROL_WORDS);
const LURE_SET = new Set<string>(LURES);

export type ItemKind = "real" | "lure" | "control";

export function kindOf(word: string): ItemKind | null {
  if (LURE_SET.has(word)) return "lure";
  if (STUDIED_SET.has(word)) return "real";
  if (CONTROL_SET.has(word)) return "control";
  return null;
}

export interface TestItem {
  word: string;
  kind: ItemKind;
  /** For real words and lures: which list they belong to. */
  list?: Lure;
}

export interface TestResponse {
  word: string;
  saidSeen: boolean;
  confidence: number; // 1–5
  rtMs: number; // time from word shown to seen/not-seen choice
}

export function shuffle<T>(arr: readonly T[], rand: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Recognition test: 3 studied words per list + all 5 lures + all controls, shuffled. */
export function buildTest(rand: () => number = Math.random): TestItem[] {
  const items: TestItem[] = [];
  for (const lure of LURES) {
    for (const w of shuffle(DRM_LISTS[lure], rand).slice(0, STUDIED_PER_LIST_IN_TEST)) {
      items.push({ word: w, kind: "real", list: lure });
    }
    items.push({ word: lure, kind: "lure", list: lure });
  }
  for (const w of CONTROL_WORDS) items.push({ word: w, kind: "control" });

  // Shuffle, then nudge so a lure never directly follows a word from its own list —
  // keeps the test from feeling like it's "pointing" at the lure.
  const out = shuffle(items, rand);
  for (let i = 1; i < out.length; i++) {
    if (out[i].kind === "lure" && out[i - 1].list === out[i].list) {
      const j = (i + 2) % out.length;
      [out[i], out[j]] = [out[j], out[i]];
    }
  }
  return out;
}

// ── Run summary (computed identically on client and server) ─────────────────

export interface LureResult {
  lure: Lure;
  falselyRecalled: boolean;
  confidence: number;
  rtMs: number;
}

export interface RunSummary {
  lures: LureResult[];
  falseRecallCount: number;
  realHitRate: number;
  controlFalseAlarmRate: number;
  realCount: number;
  controlCount: number;
}

export function summarize(responses: TestResponse[]): RunSummary {
  const lures: LureResult[] = [];
  let realSeen = 0,
    realCount = 0,
    ctrlSeen = 0,
    ctrlCount = 0;
  for (const r of responses) {
    const k = kindOf(r.word);
    if (k === "lure") {
      lures.push({ lure: r.word as Lure, falselyRecalled: r.saidSeen, confidence: r.confidence, rtMs: r.rtMs });
    } else if (k === "real") {
      realCount++;
      if (r.saidSeen) realSeen++;
    } else if (k === "control") {
      ctrlCount++;
      if (r.saidSeen) ctrlSeen++;
    }
  }
  lures.sort((a, b) => LURES.indexOf(a.lure) - LURES.indexOf(b.lure));
  return {
    lures,
    falseRecallCount: lures.filter((l) => l.falselyRecalled).length,
    realHitRate: realCount ? realSeen / realCount : 0,
    controlFalseAlarmRate: ctrlCount ? ctrlSeen / ctrlCount : 0,
    realCount,
    controlCount: ctrlCount,
  };
}

/** Strict server-side validation of a submitted run. Returns an error string or the clean data. */
export function validateRunPayload(
  body: unknown
): { ok: true; sessionId: string; responses: TestResponse[] } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "body must be an object" };
  const b = body as Record<string, unknown>;

  const sessionId = b.sessionId;
  if (typeof sessionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
    return { ok: false, error: "invalid sessionId" };
  }

  if (!Array.isArray(b.responses) || b.responses.length < LURES.length || b.responses.length > 60) {
    return { ok: false, error: "invalid responses" };
  }

  const seen = new Set<string>();
  const responses: TestResponse[] = [];
  for (const raw of b.responses) {
    if (!raw || typeof raw !== "object") return { ok: false, error: "invalid response item" };
    const r = raw as Record<string, unknown>;
    const word = typeof r.word === "string" ? r.word.toLowerCase() : "";
    if (!kindOf(word)) return { ok: false, error: "unknown word" };
    if (seen.has(word)) return { ok: false, error: "duplicate word" };
    seen.add(word);
    if (typeof r.saidSeen !== "boolean") return { ok: false, error: "invalid saidSeen" };
    const confidence = r.confidence;
    if (typeof confidence !== "number" || !Number.isInteger(confidence) || confidence < 1 || confidence > 5) {
      return { ok: false, error: "invalid confidence" };
    }
    const rtMs = r.rtMs;
    if (typeof rtMs !== "number" || !Number.isFinite(rtMs) || rtMs < 0 || rtMs > 600_000) {
      return { ok: false, error: "invalid rtMs" };
    }
    responses.push({ word, saidSeen: r.saidSeen, confidence, rtMs: Math.round(rtMs) });
  }

  // Every lure must be answered exactly once, plus at least one real and one control word.
  for (const l of LURES) if (!seen.has(l)) return { ok: false, error: "missing lure" };
  if (!responses.some((r) => kindOf(r.word) === "real")) return { ok: false, error: "missing studied words" };
  if (!responses.some((r) => kindOf(r.word) === "control")) return { ok: false, error: "missing control words" };

  return { ok: true, sessionId, responses };
}
