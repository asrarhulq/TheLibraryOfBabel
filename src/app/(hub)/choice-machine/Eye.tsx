// The machine's eye: a brass bezel, a slowly turning index ring, an amber iris and a pupil that
// contracts while it "thinks". It never looks toward either side, so it gives nothing away.

export type EyeState = "idle" | "watch" | "think" | "sealed" | "hit" | "miss";

const TICKS = Array.from({ length: 72 }, (_, i) => i);
const STRIATIONS = Array.from({ length: 64 }, (_, i) => i);
const MARKS = Array.from({ length: 12 }, (_, i) => i);

export default function Eye({ state, timerKey }: { state: EyeState; timerKey?: number }) {
  return (
    <div className="cm-eye" data-state={state} aria-hidden="true">
      <svg viewBox="0 0 200 200">
        <defs>
          <radialGradient id="cm-iris" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffcf7a" />
            <stop offset=".35" stopColor="#d9831f" />
            <stop offset=".7" stopColor="#6b3208" />
            <stop offset="1" stopColor="#1a0b03" />
          </radialGradient>
          <radialGradient id="cm-pupil" cx="45%" cy="40%" r="60%">
            <stop offset="0" stopColor="#2a1606" />
            <stop offset="1" stopColor="#050302" />
          </radialGradient>
          <linearGradient id="cm-brass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f3dca2" />
            <stop offset=".45" stopColor="#b88a45" />
            <stop offset=".7" stopColor="#6e4f22" />
            <stop offset="1" stopColor="#d8b46e" />
          </linearGradient>
        </defs>

        {/* bezel */}
        <circle cx="100" cy="100" r="97" fill="#0b0806" stroke="url(#cm-brass)" strokeWidth="3" />
        <g className="cm-eye-ticks">
          {TICKS.map((i) => {
            const a = (i / 72) * Math.PI * 2;
            const long = i % 6 === 0;
            const r1 = long ? 84 : 88;
            return (
              <line
                key={i}
                x1={100 + Math.cos(a) * r1}
                y1={100 + Math.sin(a) * r1}
                x2={100 + Math.cos(a) * 93}
                y2={100 + Math.sin(a) * 93}
                stroke="#c9a35f"
                strokeOpacity={long ? 0.85 : 0.4}
                strokeWidth={long ? 1.4 : 0.8}
              />
            );
          })}
        </g>

        {/* countdown: drains once per choice, a nudge to go with your gut */}
        {timerKey !== undefined && (
          <circle key={timerKey} className="cm-eye-timer" cx="100" cy="100" r="79" pathLength={1} fill="none" />
        )}

        {/* turning index ring */}
        <g className="cm-eye-ring">
          <circle cx="100" cy="100" r="72" fill="none" stroke="#c9a35f" strokeOpacity=".35" strokeDasharray="1 3" />
          {MARKS.map((i) => {
            const a = (i / 12) * Math.PI * 2;
            const x = 100 + Math.cos(a) * 72;
            const y = 100 + Math.sin(a) * 72;
            return <rect key={i} x={x - 2} y={y - 2} width="4" height="4" fill="#d9b874" transform={`rotate(45 ${x} ${y})`} />;
          })}
        </g>

        {/* iris */}
        <circle cx="100" cy="100" r="60" fill="#120904" />
        <g className="cm-eye-iris">
          <circle cx="100" cy="100" r="58" fill="url(#cm-iris)" />
          {STRIATIONS.map((i) => {
            const a = (i / 64) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={100 + Math.cos(a) * 22}
                y1={100 + Math.sin(a) * 22}
                x2={100 + Math.cos(a) * 57}
                y2={100 + Math.sin(a) * 57}
                stroke={i % 2 ? "#2b1205" : "#ffd58a"}
                strokeOpacity={i % 2 ? 0.5 : 0.22}
                strokeWidth=".9"
              />
            );
          })}
          <circle cx="100" cy="100" r="58" fill="none" stroke="#000" strokeOpacity=".55" strokeWidth="5" />
        </g>
        <g className="cm-eye-pupil">
          <circle cx="100" cy="100" r="22" fill="url(#cm-pupil)" />
        </g>
        {/* glass */}
        <ellipse cx="80" cy="74" rx="20" ry="11" fill="#fff" opacity=".12" transform="rotate(-30 80 74)" />
        <circle cx="116" cy="118" r="3" fill="#fff" opacity=".18" />
      </svg>
    </div>
  );
}
