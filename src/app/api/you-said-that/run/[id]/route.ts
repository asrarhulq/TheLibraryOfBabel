import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { deleteChoiceblindRun } from "@/lib/db/choiceblindRuns";
import { clientKey, rateLimit } from "@/lib/memory/rateLimit";

export const dynamic = "force-dynamic";

const ID_RE = /^[A-Za-z0-9]{10}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

// DELETE /api/you-said-that/run/:id — "Delete my run". Needs the delete token that only the browser
// which created the run received, so a shared result link can't be used to delete someone's run.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limit = rateLimit(`yst:del:${clientKey(request.headers)}`, 10, 10 * 60 * 1000);
  if (!limit.ok) return Response.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  const { id } = await params;
  const token = request.headers.get("x-delete-token") || "";
  if (!ID_RE.test(id) || !TOKEN_RE.test(token)) return Response.json({ error: "Invalid request" }, { status: 400 });
  try {
    const ok = await deleteChoiceblindRun(id, createHash("sha256").update(token).digest("hex"));
    // same answer for "no such run" and "wrong token": nothing to learn by probing
    return ok ? new Response(null, { status: 204 }) : Response.json({ error: "Not found" }, { status: 404 });
  } catch (e) {
    console.error("you-said-that delete failed", e);
    return Response.json({ error: "Could not delete right now" }, { status: 503 });
  }
}
