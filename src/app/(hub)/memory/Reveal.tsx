"use client";

import type { TestResponse } from "@/lib/memory/drm";

// Placeholder — the full reveal lands in a later commit.
export default function Reveal({ responses, onRestart }: { sessionId: string; responses: TestResponse[]; onRestart: () => void }) {
  return (
    <section className="mem-stage mem-enter">
      <h2 className="serif mem-h2">Thanks — {responses.length} answers recorded.</h2>
      <button className="mem-btn mem-btn--primary" onClick={onRestart}>
        Try again
      </button>
    </section>
  );
}
