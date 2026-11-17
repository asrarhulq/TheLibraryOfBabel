import "server-only";
import { createHash, randomBytes } from "node:crypto";

// Small in-memory sliding-window limiter. Keys are salted hashes of the client address,
// held only in this process's memory for the length of the window — never written to the
// database or logs. On serverless hosts each instance has its own window, so this is a
// best-effort guard; the unique sessionId index and strict validation do the rest.

const SALT = randomBytes(16).toString("hex");
const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

export function clientKey(headers: Headers): string {
  const raw =
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("cf-connecting-ip") ||
    "unknown";
  return createHash("sha256").update(SALT).update(raw).digest("base64url").slice(0, 22);
}

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  if (now - lastSweep > windowMs) {
    for (const [k, ts] of buckets) if (!ts.length || now - ts[ts.length - 1] > windowMs) buckets.delete(k);
    lastSweep = now;
  }
  const ts = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (ts.length >= limit) {
    buckets.set(key, ts);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - ts[0])) / 1000) };
  }
  ts.push(now);
  buckets.set(key, ts);
  return { ok: true, retryAfterSec: 0 };
}
