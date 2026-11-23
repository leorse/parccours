"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import styles from "./ParkScreen.module.css";
import { mulberry32, round } from "../space/sky";
import { landPalette } from "../space/color";
import { BAND, sideBands, useViewportSpan } from "../space/viewport";
import { opposite, travelVars, type TravelDir } from "../space/travel";
import { getPark } from "./data";

const OUTLINE = "#22301b";
const POST = "#2b2b3a";
const TRUNK = "#8a5a3a";

type Land = ReturnType<typeof landPalette>;

// Repère du contenu défilant : largeur 400 ; distances mesurées depuis le bas.
const SPACING = 125; // entre deux leçons d'une même partie
// Entre une leçon et le milieu de la rivière. Plus grand en dessous : le réverbère
// (≈ 82 de haut) monte vers la rivière et ne doit pas toucher le pont (62 de demi-longueur).
const RIVER_GAP_BELOW = 150;
const RIVER_GAP_ABOVE = 85;
const BOTTOM_PAD = 120;
const TOP_PAD = 150;
const MIN_HEIGHT = 800;

const AMPLITUDE = 60; // sinuosité du sentier
const WAVELENGTH = 150;
const LAMP_OFFSET = 46; // distance réverbère ↔ milieu du sentier

const TRAVEL_OUT_MS = 600; // aligné sur l'animation travelOut du CSS

/* ------------------------------------------------------------------ */
/* Décor                                                               */
/* ------------------------------------------------------------------ */

function RoundTree({ x, y, s, crown, light }: { x: number; y: number; s: number; crown: string; light: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={OUTLINE} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="0" cy="2" rx="24" ry="6" fill={OUTLINE} opacity="0.18" stroke="none" />
      <path d="M-4 0 L-3 -26 L3 -26 L4 0 Z" fill={TRUNK} strokeWidth="2" />
      <path
        d="M-26 -34 C-34 -50 -20 -66 -6 -62 C0 -76 22 -72 24 -58 C36 -52 34 -32 22 -28 C14 -18 -14 -18 -26 -34 Z"
        fill={crown}
        strokeWidth="2.5"
      />
      <path d="M-14 -48 C-10 -54 -2 -54 0 -48 M8 -56 C12 -60 18 -58 18 -52 M-4 -36 C0 -40 8 -40 10 -34" fill="none" stroke={light} strokeWidth="2.5" />
    </g>
  );
}

function Birch({ x, y, s, crown }: { x: number; y: number; s: number; crown: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={OUTLINE} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="0" cy="2" rx="22" ry="6" fill={OUTLINE} opacity="0.18" stroke="none" />
      <path
        d="M-24 -40 C-30 -56 -16 -72 -2 -66 C6 -80 26 -72 24 -56 C34 -46 28 -30 16 -30 C6 -22 -16 -26 -24 -40 Z"
        fill={crown}
        strokeWidth="2.5"
      />
      <path d="M-3 0 L-2 -50 L2 -50 L3 0 Z" fill="#f4f1e8" strokeWidth="2" />
      <path d="M-2 -12 l3 0 M-1 -24 l3 0 M-2 -36 l2 0" stroke={OUTLINE} strokeWidth="1.6" />
    </g>
  );
}

function ConeTree({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={OUTLINE} strokeLinecap="round">
      <ellipse cx="0" cy="2" rx="16" ry="5" fill={OUTLINE} opacity="0.18" stroke="none" />
      <path d="M0 -76 C14 -76 20 -38 18 -20 C16 -8 -16 -8 -18 -20 C-20 -38 -14 -76 0 -76 Z" fill={fill} strokeWidth="2.5" />
      <path d="M0 2 L0 -50 M0 -28 L-9 -38 M0 -36 L8 -45" fill="none" strokeWidth="2.2" />
    </g>
  );
}

function Bush({ x, y, s, fill, light }: { x: number; y: number; s: number; fill: string; light: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M-26 0 C-32 -12 -20 -22 -10 -16 C-6 -28 12 -28 13 -16 C22 -22 32 -12 26 0 Z"
        fill={fill}
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M-12 -8 c3 -3 6 -3 8 0 M6 -12 c3 -3 6 -3 8 0" fill="none" stroke={light} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Tuft({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x - 5} ${y} l-2 -8 M${x - 1} ${y} l0 -10 M${x + 3} ${y} l3 -8`}
      stroke={OUTLINE}
      strokeWidth="1.6"
      strokeLinecap="round"
      opacity="0.55"
    />
  );
}

// Un élément de décor tiré au hasard, dans les teintes du continent.
function decorItem(key: string, x: number, y: number, rand: () => number, land: Land): ReactNode {
  const kind = rand();
  const s = 0.75 + rand() * 0.5;
  const at = { x: round(x), y: round(y) };
  if (kind < 0.3) return <RoundTree key={key} {...at} s={s} crown={land.foliage} light={land.foliageLight} />;
  if (kind < 0.42) return <Birch key={key} {...at} s={s} crown={land.foliageLight} />;
  if (kind < 0.58) return <ConeTree key={key} {...at} s={s} fill={rand() > 0.5 ? land.foliage : land.foliageDark} />;
  if (kind < 0.64) return <RoundTree key={key} {...at} s={s} crown={land.foliageDark} light={land.foliage} />;
  if (kind < 0.86) return <Bush key={key} {...at} s={s * 0.9} fill={land.foliage} light={land.foliageLight} />;
  return <Tuft key={key} {...at} />;
}

type Sprite = { x: number; y: number; node: ReactNode };

/* ------------------------------------------------------------------ */
/* Réverbère                                                           */
/* ------------------------------------------------------------------ */

type LampState = "on" | "off" | "next";

function Lantern({ x, y, s = 1, state }: { x: number; y: number; s?: number; state: LampState }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-9 0 L0 -7 L9 0 Z" fill={POST} />
      {/* Verre éteint, puis verre allumé par-dessus (clignotant pour la prochaine leçon) */}
      <path d="M-6 0 L6 0 L7.5 13 L-7.5 13 Z" fill="#565a70" stroke={POST} strokeWidth="2" />
      {state !== "off" && (
        <path d="M-6 0 L6 0 L7.5 13 L-7.5 13 Z" fill="#fff1a8" stroke={POST} strokeWidth="2" className={state === "next" ? styles.flicker : undefined} />
      )}
      <path d="M-8 13 L8 13 L6 16 L-6 16 Z" fill={POST} />
    </g>
  );
}

function Lamp({ x, y, double, state }: { x: number; y: number; double: boolean; state: LampState }) {
  const lanterns = double
    ? [
        { x: -16, y: -60, s: 0.85 },
        { x: 16, y: -60, s: 0.85 },
      ]
    : [{ x: 0, y: -74, s: 1 }];

  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="1" rx="10" ry="3.5" fill={OUTLINE} opacity="0.25" />
      <path d="M-6 0 L6 0 L3.5 -7 L-3.5 -7 Z" fill={POST} />
      <line x1="0" y1="-7" x2="0" y2={double ? -70 : -60} stroke={POST} strokeWidth="3.5" strokeLinecap="round" />
      {double && (
        <>
          <path d="M0 -62 C-4 -70 -14 -70 -16 -62 M0 -62 C4 -70 14 -70 16 -62" fill="none" stroke={POST} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="0" cy="-73" r="3" fill={POST} />
        </>
      )}
      {state !== "off" &&
        lanterns.map((l, i) => (
          <circle
            key={i}
            cx={l.x}
            cy={l.y + 7}
            r="20"
            fill="url(#park-glow)"
            className={state === "next" ? styles.flicker : undefined}
          />
        ))}
      {lanterns.map((l, i) => (
        <Lantern key={i} x={l.x} y={l.y} s={l.s} state={state} />
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Rivière et pont                                                     */
/* ------------------------------------------------------------------ */

// Bord ondulé de la rivière, de gauche à droite sur toute la largeur visible.
function riverEdge(y: number, phase: number, x0: number, x1: number) {
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 20) {
    pts.push(`${x} ${round(y + 6 * Math.sin(x / 40 + phase))}`);
  }
  return pts;
}

function River({ y, x0, x1 }: { y: number; x0: number; x1: number }) {
  const topPts = riverEdge(y - 34, 0, x0, x1);
  const bottomPts = riverEdge(y + 34, 1.3, x0, x1);
  const top = `M${topPts.join(" L")}`;
  const bottom = `M${bottomPts.join(" L")}`;
  // Contour fermé : bord haut de gauche à droite, puis bord bas de droite à gauche.
  const outline = `M${[...topPts, ...[...bottomPts].reverse()].join(" L")} Z`;
  // Vaguelettes réparties sur toute la largeur.
  const ripples: string[] = [];
  for (let x = x0 + 30, k = 0; x < x1; x += 110, k++) {
    const dy = [-8, 12, -14, 6][k % 4];
    ripples.push(`M${x} ${y + dy} q12 -5 24 0`);
  }
  return (
    <g>
      <path d={outline} fill="#8ccbe8" />
      <path d={top} fill="none" stroke="#7a5a3a" strokeWidth="3" />
      <path d={bottom} fill="none" stroke="#7a5a3a" strokeWidth="3" />
      <g stroke="#e3f5fc" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9">
        {ripples.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </g>
  );
}

function Bridge({ x, y, angle }: { x: number; y: number; angle: number }) {
  const planks = Array.from({ length: 13 }, (_, i) => -54 + i * 9);
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`} stroke={OUTLINE} strokeLinejoin="round">
      <rect x="-30" y="-60" width="60" height="120" fill="#b07a48" strokeWidth="2.5" />
      {planks.map((py) => (
        <line key={py} x1="-30" y1={py} x2="30" y2={py} stroke="#7a4f2c" strokeWidth="1.8" />
      ))}
      <rect x="-37" y="-62" width="8" height="124" rx="2" fill="#8f5f36" strokeWidth="2" />
      <rect x="29" y="-62" width="8" height="124" rx="2" fill="#8f5f36" strokeWidth="2" />
      {[-56, -20, 20, 56].map((py) => (
        <g key={py}>
          <rect x="-39" y={py - 4} width="12" height="8" rx="2" fill="#7a4f2c" strokeWidth="1.8" />
          <rect x="27" y={py - 4} width="12" height="8" rx="2" fill="#7a4f2c" strokeWidth="1.8" />
        </g>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Écran                                                               */
/* ------------------------------------------------------------------ */

type Props = {
  parkKey: string;
  /** Couleur du continent : prairie et feuillages en dérivent. */
  ground: string;
  /** Direction du traveling d'arrivée (celle du panneau choisi). */
  arriveDir: TravelDir;
  /** Retour aux panneaux, avec la direction du traveling de départ. */
  onBack: (dir: TravelDir) => void;
  onHome: () => void;
  /** Choix de la prochaine leçon (l'écran de leçon viendra plus tard). */
  onSelectLesson?: (index: number) => void;
};

export function ParkScreen({ parkKey, ground, arriveDir, onBack, onHome, onSelectLesson }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<SVGSVGElement>(null);
  const span = useViewportSpan("column");
  const land = useMemo(() => landPalette(ground), [ground]);
  const [leaving, setLeaving] = useState<TravelDir | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // Retour : la caméra repart dans l'autre sens que celui de l'arrivée.
  function back() {
    if (leaving) return;
    const dir = opposite(arriveDir);
    setLeaving(dir);
    timers.current.push(window.setTimeout(() => onBack(dir), TRAVEL_OUT_MS));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Backspace") back();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Sentier, réverbères, rivières et décor du cadre central (ne dépend pas de l'écran).
  const scene = useMemo(() => {
    const { parts, seen } = getPark(parkKey);
    const rand = mulberry32(parkKey.length * 9973 + parts.length * 31 + parts[0]);
    const phase = rand() * Math.PI * 2;

    // Distances depuis le bas : leçons et rivières.
    const lessonD: number[] = [];
    const riverD: number[] = [];
    let d = BOTTOM_PAD;
    parts.forEach((count, p) => {
      for (let k = 0; k < count; k++) {
        lessonD.push(d);
        if (k < count - 1) d += SPACING;
      }
      if (p < parts.length - 1) {
        riverD.push(d + RIVER_GAP_BELOW);
        d += RIVER_GAP_BELOW + RIVER_GAP_ABOVE;
      }
    });
    const height = Math.max(MIN_HEIGHT, d + TOP_PAD);
    const toY = (dist: number) => height - dist;

    // Milieu du sentier, en fonction de la distance depuis le bas.
    const pathX = (dist: number) => 200 + AMPLITUDE * Math.sin(dist / WAVELENGTH + phase);
    const slope = (dist: number) => (AMPLITUDE / WAVELENGTH) * Math.cos(dist / WAVELENGTH + phase);

    let path = "";
    for (let dist = -40; dist <= height + 40; dist += 6) {
      path += `${dist === -40 ? "M" : "L"}${round(pathX(dist))} ${round(toY(dist))} `;
    }

    const lamps = lessonD.map((dist, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const cx = pathX(dist);
      const state: LampState = i < seen ? "on" : i === seen ? "next" : "off";
      return {
        i,
        state,
        x: round(cx + side * LAMP_OFFSET),
        y: round(toY(dist)),
        // Flaque de lumière sur le sentier, côté réverbère.
        haloX: round(cx + side * 16),
        double: rand() > 0.6,
      };
    });

    const rivers = riverD.map((dist) => ({
      y: round(toY(dist)),
      bridgeX: round(pathX(dist)),
      angle: round((Math.atan(slope(dist)) * 180) / Math.PI),
    }));
    const riverYs = rivers.map((r) => r.y);

    // Arbres et buissons, à l'écart du sentier, des réverbères et des rivières.
    const decor: Sprite[] = [];
    const tries = Math.round(height / 9);
    for (let t = 0; t < tries; t++) {
      const x = -10 + rand() * 420;
      const dist = rand() * height;
      const y = toY(dist);
      if (Math.abs(x - pathX(dist)) < 82) continue;
      if (riverYs.some((ry) => Math.abs(y - ry) < 70)) continue;
      if (lamps.some((l) => Math.abs(l.x - x) < 34 && Math.abs(l.y - y) < 40)) continue;
      if (decor.some((o) => Math.abs(o.y - y) < 26 && Math.abs(o.x - x) < 44)) continue;
      decor.push({ x, y, node: decorItem(`c${t}`, x, y, rand, land) });
    }

    return { height, path, lamps, rivers, riverYs, decor, seen };
  }, [parkKey, land]);

  // Décor des côtés (écrans larges) : une bande de 100 de large à la fois, déterministe.
  const sideDecor = useMemo(() => {
    const out: Sprite[] = [];
    for (const x0 of sideBands(span)) {
      const rand = mulberry32(Math.round(x0) * 131 + scene.height);
      const band: Sprite[] = [];
      const tries = Math.round(scene.height / 36);
      for (let t = 0; t < tries; t++) {
        const x = x0 + 10 + rand() * (BAND - 20);
        const y = rand() * scene.height;
        if (scene.riverYs.some((ry) => Math.abs(y - ry) < 70)) continue;
        if (band.some((o) => Math.abs(o.y - y) < 26 && Math.abs(o.x - x) < 44)) continue;
        band.push({ x, y, node: decorItem(`s${x0}-${t}`, x, y, rand, land) });
      }
      out.push(...band);
    }
    return out;
  }, [span, scene, land]);

  // Ouverture : le parc est centré sur la prochaine leçon (ou la dernière).
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const target = scene.lamps[Math.min(scene.seen, scene.lamps.length - 1)];
    const unit = content.clientWidth / 400;
    scroller.scrollTop = target.y * unit - scroller.clientHeight * 0.55;
  }, [scene]);

  // Réverbères et décor triés de haut en bas : ce qui est plus bas passe devant.
  const sprites: Sprite[] = [
    ...scene.decor,
    ...sideDecor,
    ...scene.lamps.map((l) => ({
      x: l.x,
      y: l.y,
      node:
        l.state === "next" ? (
          <g
            key={`lamp-${l.i}`}
            role="button"
            tabIndex={0}
            aria-label={`Leçon ${l.i + 1}`}
            className={styles.next}
            onClick={() => onSelectLesson?.(l.i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectLesson?.(l.i);
              }
            }}
          >
            <rect x={l.x - 30} y={l.y - 95} width="60" height="105" fill="transparent" />
            <Lamp x={l.x} y={l.y} double={l.double} state={l.state} />
          </g>
        ) : (
          <Lamp key={`lamp-${l.i}`} x={l.x} y={l.y} double={l.double} state={l.state} />
        ),
    })),
  ].sort((a, b) => a.y - b.y);

  const travel = leaving ?? arriveDir;

  return (
    <div
      className={`${styles.root} ${leaving ? styles.leaving : styles.arriving}`}
      style={{ background: land.ground, ...travelVars(travel) }}
    >
      <div className={styles.scroller} ref={scrollerRef}>
        <svg
          ref={contentRef}
          className={styles.content}
          viewBox={`0 0 400 ${scene.height}`}
          style={{ aspectRatio: `400 / ${scene.height}` }}
        >
          <defs>
            <radialGradient id="park-halo">
              <stop offset="0" stopColor="#fffbe0" stopOpacity="1" />
              <stop offset="0.55" stopColor="#fff7c2" stopOpacity="0.75" />
              <stop offset="1" stopColor="#fff7c2" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="park-glow">
              <stop offset="0" stopColor="#fff3b0" stopOpacity="0.9" />
              <stop offset="1" stopColor="#fff3b0" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sentier */}
          <path d={scene.path} fill="none" stroke={OUTLINE} strokeWidth="52" strokeLinecap="round" strokeLinejoin="round" />
          <path d={scene.path} fill="none" stroke={land.path} strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" />

          {/* Flaques de lumière des réverbères allumés, sur le sentier */}
          {scene.lamps
            .filter((l) => l.state !== "off")
            .map((l) => (
              <ellipse
                key={l.i}
                cx={l.haloX}
                cy={l.y}
                rx="56"
                ry="34"
                fill="url(#park-halo)"
                className={l.state === "next" ? styles.flicker : undefined}
              />
            ))}

          {scene.rivers.map((r, i) => (
            <g key={i}>
              <River y={r.y} x0={span.xMin - 100} x1={span.xMax + 100} />
              <Bridge x={r.bridgeX} y={r.y} angle={r.angle} />
            </g>
          ))}

          {sprites.map((sp) => sp.node)}
        </svg>
      </div>

      {/* En-tête fixe : retour et accueil (pas de texte) */}
      <div className={styles.header}>
        <svg viewBox="0 0 400 100" className={styles.headerSvg}>
          <g
            role="button"
            tabIndex={0}
            aria-label="Retour aux cours"
            className={styles.icon}
            onClick={back}
            onKeyDown={(e) => e.key === "Enter" && back()}
          >
            <rect x="4" y="10" width="56" height="70" fill="transparent" />
            {/* Pastille claire : l'icône reste lisible au-dessus des arbres */}
            <circle cx="31" cy="46" r="24" fill="#ffffff" fillOpacity="0.7" />
            <path d="M40 28 L22 46 L40 64" fill="none" stroke={OUTLINE} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g
            role="button"
            tabIndex={0}
            aria-label="Accueil"
            className={styles.icon}
            onClick={onHome}
            onKeyDown={(e) => e.key === "Enter" && onHome()}
          >
            <rect x="336" y="10" width="60" height="70" fill="transparent" />
            <circle cx="364" cy="46" r="24" fill="#ffffff" fillOpacity="0.7" />
            <path
              d="M346 46 L364 30 L382 46 M350 43 L350 62 L378 62 L378 43 M359 62 L359 51 L369 51 L369 62"
              fill="none"
              stroke={OUTLINE}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
