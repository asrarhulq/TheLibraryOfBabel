"use client";

import { useEffect, useRef } from "react";
import { geoDistance, geoGraticule10, geoOrthographic, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { Feature, MultiLineString } from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";

// Orthographic globe on canvas. Spins while a roll is in flight, eases onto the result,
// lights up the region and drops a glowing pin. Shapes: Natural Earth 1:110m (world-atlas).

interface World {
  countries: Feature[];
  borders: MultiLineString;
}
let worldPromise: Promise<World> | null = null;
function loadWorld(): Promise<World> {
  worldPromise ??= fetch("/birth-lottery/countries-110m.json")
    .then((r) => r.json())
    .then((topo: Topology<{ countries: GeometryCollection }>) => ({
      countries: (feature(topo, topo.objects.countries) as unknown as { features: Feature[] }).features,
      borders: mesh(topo, topo.objects.countries, (a, b) => a !== b),
    }));
  return worldPromise;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const GRATICULE = geoGraticule10();

export default function Globe({
  target,
  spinning,
  highlight,
  focusNum,
  label,
  onLanded,
}: {
  /** [lon, lat] of the pin, or null while waiting / idle. */
  target: [number, number] | null;
  spinning: boolean;
  highlight: string[];
  focusNum: string | null;
  label: string;
  onLanded?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({
    rot: [-20, -15] as [number, number],
    mode: "idle" as "idle" | "spin" | "ease" | "landed",
    ease: null as null | { from: [number, number]; to: [number, number]; t0: number; dur: number },
    pinT0: 0,
    last: 0,
    world: null as World | null,
    reduce: false,
    landedFired: false,
  });
  const props = useRef({ target, spinning, highlight: new Set(highlight), focusNum, onLanded });
  useEffect(() => {
    props.current = { target, spinning, highlight: new Set(highlight), focusNum, onLanded };
  });

  // Mode transitions driven by props.
  useEffect(() => {
    const s = state.current;
    if (spinning && !target) {
      s.mode = "spin";
      s.landedFired = false;
    } else if (target) {
      const [lon, lat] = target;
      const to: [number, number] = [-lon, Math.max(-50, Math.min(50, -lat))];
      if (s.reduce) {
        s.rot = to;
        s.mode = "landed";
        s.pinT0 = performance.now() - 2000;
      } else {
        // finish with at least one full extra turn so the landing feels like a spin
        let fromL = s.rot[0];
        while (fromL > to[0] - 300) fromL -= 360;
        s.ease = { from: [fromL, s.rot[1]], to, t0: performance.now(), dur: s.mode === "spin" ? 1900 : 2600 };
        s.mode = "ease";
      }
      s.landedFired = false;
    } else s.mode = "idle";
  }, [spinning, target]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const s = state.current;
    s.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let alive = true;
    let size = 0;
    let dpr = 1;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = Math.max(10, Math.floor(r.width));
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    loadWorld().then((w) => {
      s.world = w;
    });

    const draw = (now: number) => {
      if (!alive) return;
      const dt = s.last ? Math.min(64, now - s.last) : 16;
      s.last = now;
      const p = props.current;

      if (s.mode === "idle" && !s.reduce) s.rot[0] += dt * 0.006;
      if (s.mode === "spin") s.rot[0] += dt * 0.42;
      if (s.mode === "ease" && s.ease) {
        const t = Math.min(1, (now - s.ease.t0) / s.ease.dur);
        const k = easeOutCubic(t);
        s.rot = [s.ease.from[0] + (s.ease.to[0] - s.ease.from[0]) * k, s.ease.from[1] + (s.ease.to[1] - s.ease.from[1]) * k];
        if (t >= 1) {
          s.mode = "landed";
          s.pinT0 = now;
        }
      }
      if (s.mode === "landed" && !s.landedFired && now - s.pinT0 > 650) {
        s.landedFired = true;
        p.onLanded?.();
      }

      const W = size * dpr;
      const R = W * 0.43;
      const proj = geoOrthographic()
        .scale(R)
        .translate([W / 2, W / 2])
        .clipAngle(90)
        .rotate([s.rot[0], s.rot[1]]);
      const path = geoPath(proj, ctx);
      ctx.clearRect(0, 0, W, W);

      // atmosphere
      const glow = ctx.createRadialGradient(W / 2, W / 2, R * 0.9, W / 2, W / 2, R * 1.16);
      glow.addColorStop(0, "rgba(212,166,86,0.22)");
      glow.addColorStop(1, "rgba(212,166,86,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(W / 2, W / 2, R * 1.16, 0, Math.PI * 2);
      ctx.fill();

      // ocean
      const sea = ctx.createRadialGradient(W / 2 - R * 0.35, W / 2 - R * 0.4, R * 0.1, W / 2, W / 2, R);
      sea.addColorStop(0, "#1c2a3c");
      sea.addColorStop(1, "#080d15");
      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.fillStyle = sea;
      ctx.fill();

      ctx.beginPath();
      path(GRATICULE);
      ctx.strokeStyle = "rgba(236,223,198,0.06)";
      ctx.lineWidth = dpr * 0.6;
      ctx.stroke();

      if (s.world) {
        const landed = s.mode === "landed" || s.mode === "ease";
        for (const f of s.world.countries) {
          const id = String(f.id).padStart(3, "0");
          ctx.beginPath();
          path(f as GeoPermissibleObjects);
          if (landed && p.target && id === p.focusNum) ctx.fillStyle = "#f1c776";
          else if (landed && p.target && p.highlight.has(id)) ctx.fillStyle = "#b7873a";
          else ctx.fillStyle = "#4a3b2a";
          ctx.fill();
        }
        ctx.beginPath();
        path(s.world.borders);
        ctx.strokeStyle = "rgba(10,7,4,0.55)";
        ctx.lineWidth = dpr * 0.5;
        ctx.stroke();
      }

      // rim light
      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.strokeStyle = "rgba(212,166,86,0.4)";
      ctx.lineWidth = dpr * 1;
      ctx.stroke();
      const shade = ctx.createRadialGradient(W / 2 - R * 0.4, W / 2 - R * 0.45, R * 0.2, W / 2, W / 2, R * 1.02);
      shade.addColorStop(0, "rgba(255,240,210,0.07)");
      shade.addColorStop(0.7, "rgba(0,0,0,0)");
      shade.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.fillStyle = shade;
      ctx.fill();

      // pin
      if (s.mode === "landed" && p.target) {
        const center: [number, number] = [-s.rot[0], -s.rot[1]];
        if (geoDistance(p.target, center) < Math.PI / 2 - 0.05) {
          const [x, y] = proj(p.target)!;
          const t = s.reduce ? 1 : Math.min(1, (now - s.pinT0) / 520);
          const drop = (1 - easeOutCubic(t)) * -60 * dpr;
          const pulse = s.reduce ? 0.5 : ((now - s.pinT0) % 1800) / 1800;
          // pulse ring
          ctx.beginPath();
          ctx.arc(x, y, (6 + pulse * 26) * dpr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,214,140,${0.7 * (1 - pulse)})`;
          ctx.lineWidth = 1.5 * dpr;
          if (t >= 1) ctx.stroke();
          // glow
          const g = ctx.createRadialGradient(x, y + drop, 0, x, y + drop, 22 * dpr);
          g.addColorStop(0, "rgba(255,226,160,0.95)");
          g.addColorStop(0.35, "rgba(240,180,90,0.45)");
          g.addColorStop(1, "rgba(240,180,90,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y + drop, 22 * dpr, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y + drop, 4.2 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = "#fff4dc";
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="bl-globe" role="img" aria-label={label} />;
}
