'use client';

import React from 'react';

// The hexagon sigil to the left of the title. Clicking it replays the intro sequence.
export default function IntroLogo() {
  const replay = () => {
    window.dispatchEvent(new CustomEvent('babel:replay-intro'));
  };

  return (
    <button
      onClick={replay}
      title="Replay the introduction"
      aria-label="Replay the introduction"
      className="group shrink-0 text-babel-gold hover:text-babel-parchment transition-colors"
    >
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" className="transition-transform duration-500 group-hover:rotate-180">
        {/* pointy-top hexagon */}
        <polygon
          points="13,2 23,7.5 23,18.5 13,24 3,18.5 3,7.5"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="rgba(212,175,55,0.06)"
        />
        {/* inner mark — a small book/gap suggesting a gallery */}
        <polygon
          points="13,7 18,9.75 18,15.25 13,18 8,15.25 8,9.75"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.6"
        />
        <circle cx="13" cy="13" r="1.4" fill="currentColor" />
      </svg>
    </button>
  );
}
