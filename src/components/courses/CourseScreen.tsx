"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Fredoka } from "next/font/google";
import styles from "./CourseScreen.module.css";
import { mulberry32, round } from "../space/sky";
import { wrap } from "../space/text";
import { landPalette } from "../space/color";
import { BAND, sideBands, useViewportSpan } from "../space/viewport";
import { travelVars, type TravelDir } from "../space/travel";
import { SUBJECTS, YEARS } from "../subjects/data";
import { CHAPTERS } from "../chapters/data";
import { islandColor } from "../chapters/island";
import { getCourses } from "./data";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["600"] });

const OUTLINE = "#14102a";
const INK = "#1d2a4a";
const WOOD = "#dc9f66";
const WOOD_DARK = "#b8784a";

/* ------------------------------------------------------------------ */
/* Décor                                                               */
/* ------------------------------------------------------------------ */

const CLOUD = "M0 0 C-4 -18 14 -30 30 -22 C36 -42 68 -46 80 -26 C92 -38 118 -32 120 -14 C134 -14 142 -4 140 0 Z";

// Nuages (une réserve ; on en affiche selon la largeur visible).
const CLOUD_POOL = (() => {
  const rand = mulberry32(2024);
  return Array.from({ length: 48 }, (_, i) => ({
    y: round(105 + (i % 4) * 34 + rand() * 20),
    s: round(0.55 + rand() * 0.7),
    speed: round(0.6 + rand() * 0.6), // facteur de durée
    phase: rand(), // position de départ dans le cycle (0–1)
  }));
})();
const CLOUDS_PER_400 = 3.2; // densité sur le trajet (≈ 3 nuages visibles sur un téléphone)
const CLOUD_SECONDS_PER_400 = 34; // ≈ temps pour traverser 400 unités

function RoundTree({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={OUTLINE} strokeLinecap="round">
      <ellipse cx="0" cy="2" rx="18" ry="4" fill={OUTLINE} opacity="0.15" stroke="none" />
      <circle cx="0" cy="-34" r="22" fill={fill} strokeWidth="2.5" />
      <path d="M0 0 L0 -40 M0 -22 L-10 -32 M0 -28 L9 -38" fill="none" strokeWidth="2.5" />
    </g>
  );
}

function ConeTree({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={OUTLINE} strokeLinecap="round">
      <ellipse cx="0" cy="2" rx="16" ry="4" fill={OUTLINE} opacity="0.15" stroke="none" />
      <path d="M0 -78 C14 -78 20 -40 18 -22 C16 -10 -16 -10 -18 -22 C-20 -40 -14 -78 0 -78 Z" fill={fill} strokeWidth="2.5" />
      <path d="M0 2 L0 -52 M0 -30 L-9 -40 M0 -38 L8 -47" fill="none" strokeWidth="2.5" />
    </g>
  );
}

function Bush({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M-30 0 C-36 -14 -22 -24 -12 -18 C-8 -32 12 -32 14 -18 C24 -24 36 -14 30 0 Z"
        fill={fill}
        stroke={OUTLINE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {[[-16, -8], [-4, -16], [8, -9], [18, -6], [2, -5]].map(([cx, cy]) => (
        <circle key={`${cx}${cy}`} cx={cx} cy={cy} r="1.6" fill={OUTLINE} opacity="0.55" />
      ))}
    </g>
  );
}

function Tuft({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x - 6} ${y} l-2 -9 M${x - 2} ${y} l0 -12 M${x + 2} ${y} l3 -10 M${x + 6} ${y} l4 -7`}
      stroke={OUTLINE}
      strokeWidth="1.8"
      strokeLinecap="round"
      opacity="0.7"
    />
  );
}

const TUFTS = [
  [49, 400], [328, 429], [31, 525], [374, 502], [270, 627], [156, 686], [239, 670], [73, 572], [68, 432], [300, 740], [110, 760],
];

// Décor d'une bande de 100 de large hors du cadre (écrans larges), déterministe.
function sideBand(x0: number, foliage: string, foliageDark: string): ReactNode[] {
  const rand = mulberry32(Math.round(x0) * 7 + 911);
  const items: { y: number; node: ReactNode }[] = [];
  const px = () => round(x0 + 15 + rand() * (BAND - 30));

  // Clés préfixées par la bande : toutes les bandes finissent dans la même liste.
  const k0 = `side${x0}`;

  if (rand() < 0.7) {
    const y = round(252 + rand() * 22);
    items.push({ y, node: rand() < 0.6 ? <RoundTree key={`${k0}h`} x={px()} y={y} s={0.55 + rand() * 0.3} fill={foliage} /> : <ConeTree key={`${k0}h`} x={px()} y={y} s={0.5 + rand() * 0.3} fill={foliageDark} /> });
  }
  for (let k = 0; k < 2; k++) {
    const y = round(300 + k * 150 + rand() * 120);
    const kind = rand();
    const s = 0.8 + rand() * 0.5;
    const node =
      kind < 0.35 ? <RoundTree key={`${k0}m${k}`} x={px()} y={y} s={s} fill={foliage} />
      : kind < 0.6 ? <ConeTree key={`${k0}m${k}`} x={px()} y={y} s={s} fill={foliageDark} />
      : <Bush key={`${k0}m${k}`} x={px()} y={y} s={s} fill={foliage} />;
    items.push({ y, node });
  }
  for (let k = 0; k < 3; k++) {
    const y = round(380 + rand() * 400);
    items.push({ y, node: <Tuft key={`${k0}t${k}`} x={px()} y={y} /> });
  }
  if (rand() < 0.6) {
    const y = round(740 + rand() * 50);
    items.push({ y, node: <Bush key={`${k0}b`} x={px()} y={y} s={1.8 + rand() * 0.6} fill={foliage} /> });
  }
  return items.sort((a, b) => a.y - b.y).map((it) => it.node);
}

/* ------------------------------------------------------------------ */
/* Panneaux                                                            */
/* ------------------------------------------------------------------ */

const SIGN_FONT = 17;
const SIGN_LINE = 21;
const SIGN_CHARS = 20;
const SIGN_GAP = 14;
const TIP = 26;
const POST_X = 200;
const FIRST_SIGN_Y = 284;

const TRAVEL_OUT_MS = 600; // aligné sur l'animation travelOut du CSS

type Props = {
  subjectId: string;
  year: string;
  chapterIndex: number;
  onBack: () => void;
  onHome: () => void;
  /** Appelé à la fin du traveling vers le parc, dans la direction du panneau choisi. */
  onSelectCourse?: (index: number, dir: TravelDir) => void;
  /** Retour depuis le parc : traveling d'arrivée dans cette direction. */
  arriveDir?: TravelDir;
};

export function CourseScreen({ subjectId, year, chapterIndex, onBack, onHome, onSelectCourse, arriveDir }: Props) {
  const s = Math.max(0, SUBJECTS.findIndex((x) => x.id === subjectId));
  const y = Math.max(0, YEARS.indexOf(year));
  const subject = SUBJECTS[s];
  const chapterTitle = CHAPTERS[subject.id]?.[y]?.[chapterIndex] ?? "";
  const courses = getCourses(subject.id, YEARS[y], chapterIndex);
  const [picked, setPicked] = useState<number | null>(null);
  const [leaving, setLeaving] = useState<TravelDir | null>(null);
  const timers = useRef<number[]>([]);
  const span = useViewportSpan("meet");

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // La terre prend la couleur du continent choisi.
  const land = landPalette(islandColor(s, chapterIndex));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Backspace") onBack();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  // Cartouche du titre : « MATIÈRE · Chapitre » sur plusieurs lignes.
  const title = useMemo(() => {
    const lines = wrap(`${subject.name} · ${chapterTitle}`, 20);
    const w = Math.min(236, Math.max(...lines.map((l) => l.length)) * 11 + 40);
    return { lines, w, h: lines.length * 25 + 22 };
  }, [subject.name, chapterTitle]);

  // Panneaux empilés le long du poteau, pointe alternativement à gauche et à droite.
  const signs = useMemo(() => {
    let top = FIRST_SIGN_Y;
    return courses.map((text, i) => {
      const lines = wrap(text, SIGN_CHARS);
      const w = Math.min(244, Math.max(160, Math.max(...lines.map((l) => l.length)) * 9.4 + 50));
      const h = lines.length * SIGN_LINE + 22;
      const left = i % 2 === 0;
      const cx = left ? POST_X - 8 : POST_X + 8;
      const x0 = cx - w / 2;
      const x1 = cx + w / 2;
      const y0 = top;
      const y1 = top + h;
      const mid = (y0 + y1) / 2;
      top = y1 + SIGN_GAP;
      const d = left
        ? `M${x0 + TIP} ${y0} L${x1} ${y0} L${x1} ${y1} L${x0 + TIP} ${y1} L${x0} ${mid} Z`
        : `M${x0} ${y0} L${x1 - TIP} ${y0} L${x1} ${mid} L${x1 - TIP} ${y1} L${x0} ${y1} Z`;
      const textX = left ? (x0 + TIP + x1) / 2 : (x0 + x1 - TIP) / 2;
      return { text, lines, d, x0, x1, y0, y1, mid, textX, left };
    });
  }, [courses]);

  const postTop = FIRST_SIGN_Y - 22;
  const postBottom = Math.max(568, (signs.at(-1)?.y1 ?? 500) + 70);

  // Décor des côtés (écrans larges) et nuages sur toute la largeur visible.
  const sides = useMemo(
    () => sideBands(span).flatMap((x0) => sideBand(x0, land.foliage, land.foliageDark)),
    [span, land.foliage, land.foliageDark],
  );
  const clouds = useMemo(() => {
    const width = span.xMax - span.xMin + 400; // départ et arrivée hors champ
    const count = Math.min(CLOUD_POOL.length, Math.round((CLOUDS_PER_400 * width) / 400));
    const base = (CLOUD_SECONDS_PER_400 * width) / 400;
    return CLOUD_POOL.slice(0, count).map((c) => {
      const duration = round(base * c.speed * 2);
      return { ...c, duration, delay: round(c.phase * duration), from: span.xMin - 200, to: span.xMax + 60 };
    });
  }, [span]);

  function pick(i: number) {
    if (leaving) return;
    // La caméra part du côté où pointe le panneau.
    const dir: TravelDir = signs[i].left ? "left" : "right";
    setPicked(i);
    setLeaving(dir);
    timers.current.push(window.setTimeout(() => onSelectCourse?.(i, dir), TRAVEL_OUT_MS));
  }

  const travel = leaving ?? arriveDir;
  const rootClass = [styles.root, leaving ? styles.leaving : arriveDir && styles.arriving].filter(Boolean).join(" ");

  return (
    <div className={rootClass} style={{ background: land.ground, ...(travel ? travelVars(travel) : {}) }}>
      <svg className={styles.scene} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="pc-sky" x1="0" y1="-200" x2="0" y2="260" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#9fd0ee" />
            <stop offset="0.6" stopColor="#d9e8ee" />
            <stop offset="1" stopColor="#fbf0e0" />
          </linearGradient>
        </defs>

        {/* Ciel et nuages (débordent du cadre pour remplir tout l'écran) */}
        <rect x="-4000" y="-2000" width="8400" height="2300" fill="url(#pc-sky)" />
        <g aria-hidden="true">
          {clouds.map((c, i) => (
            <g
              key={i}
              className={styles.cloud}
              style={
                {
                  animationDuration: `${c.duration}s`,
                  animationDelay: `${-c.delay}s`,
                  "--cloud-from": `${c.from}px`,
                  "--cloud-to": `${c.to}px`,
                } as CSSProperties
              }
            >
              <g transform={`translate(0 ${c.y}) scale(${c.s})`}>
                <path d={CLOUD} transform="translate(5 4)" fill="#e3ecf2" />
                <path d={CLOUD} fill="#fdfbf6" />
              </g>
            </g>
          ))}
        </g>

        {/* Prairie, de la couleur du continent */}
        <path
          d="M-4000 262 C-400 258 60 244 200 246 C340 248 700 256 4400 262 L4400 2000 L-4000 2000 Z"
          fill={land.ground}
          stroke={OUTLINE}
          strokeWidth="2.5"
        />

        <g aria-hidden="true">
          {sides}

          <RoundTree x={30} y={262} s={0.75} fill={land.foliage} />
          <Bush x={66} y={276} s={0.8} fill={land.foliage} />
          <ConeTree x={342} y={292} s={0.9} fill={land.foliage} />
          <RoundTree x={373} y={258} s={0.7} fill={land.foliage} />
          <Bush x={364} y={334} s={1} fill={land.foliage} />
          <RoundTree x={30} y={352} s={1.2} fill={land.foliage} />
          <Bush x={60} y={362} s={0.8} fill={land.foliage} />

          {/* Sentiers en pointillés qui mènent au poteau */}
          <g fill="none" stroke={OUTLINE} strokeWidth="2.5" strokeDasharray="0.1 8" strokeLinecap="round" opacity="0.8">
            <path d={`M-140 455 C40 470 120 ${postBottom - 30} ${POST_X - 32} ${postBottom - 14}`} />
            <path d={`M540 435 C360 470 280 ${postBottom - 30} ${POST_X + 32} ${postBottom - 14}`} />
            <path d={`M${POST_X + 34} ${postBottom + 4} C290 ${postBottom + 10} 340 ${postBottom + 40} 380 ${postBottom + 68}`} />
            <path d={`M${POST_X - 12} ${postBottom + 16} C150 ${postBottom + 50} 90 ${postBottom + 100} 60 ${postBottom + 130}`} />
          </g>

          {TUFTS.map(([x, ty]) => (
            <Tuft key={`${x}-${ty}`} x={x} y={ty} />
          ))}

          <ConeTree x={385} y={650} s={1.5} fill={land.foliage} />
          <Bush x={30} y={760} s={2.4} fill={land.foliage} />
          <Bush x={360} y={770} s={2.2} fill={land.foliage} />
        </g>

        {/* Poteau indicateur */}
        <ellipse cx={POST_X} cy={postBottom} rx="78" ry="9" fill={land.shadow} opacity="0.6" />
        <rect x={POST_X - 9} y={postTop} width="18" height={postBottom - postTop} rx="3" fill={WOOD} stroke={OUTLINE} strokeWidth="3" />
        <path d={`M${POST_X - 2} ${postTop + 30} l0 40 M${POST_X + 3} ${postBottom - 60} l0 30`} stroke={WOOD_DARK} strokeWidth="2" strokeLinecap="round" />
        <Tuft x={POST_X - 12} y={postBottom} />
        <Tuft x={POST_X + 14} y={postBottom + 1} />

        {signs.map((sg, i) => (
          <g key={i}>
            <g
              role="button"
              tabIndex={0}
              aria-label={sg.text}
              className={`${styles.sign} ${picked === i ? styles.picked : ""}`}
              style={{ transformOrigin: `${POST_X}px ${sg.mid}px` }}
              onClick={() => pick(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  pick(i);
                }
              }}
            >
              <path d={sg.d} fill={WOOD} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
              {/* Veinures du bois */}
              <path
                d={`M${sg.x1 - 34} ${sg.y0 + 7} l18 0 M${sg.x0 + 40} ${sg.y1 - 7} l22 0 M${sg.left ? sg.x1 - 16 : sg.x0 + 10} ${sg.mid + 4} l8 0`}
                stroke={WOOD_DARK}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <text
                x={sg.textX}
                y={sg.mid - ((sg.lines.length - 1) * SIGN_LINE) / 2 + SIGN_FONT * 0.35}
                textAnchor="middle"
                fontFamily={fredoka.style.fontFamily}
                fontWeight="600"
                fontSize={SIGN_FONT}
                fill={OUTLINE}
              >
                {sg.lines.map((line, j) => (
                  <tspan key={j} x={sg.textX} dy={j ? SIGN_LINE : 0}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          </g>
        ))}

        {/* En-tête : retour, titre, accueil */}
        <g
          role="button"
          tabIndex={0}
          aria-label="Retour aux chapitres"
          className={styles.icon}
          onClick={onBack}
          onKeyDown={(e) => e.key === "Enter" && onBack()}
        >
          <rect x="4" y="10" width="56" height="70" fill="transparent" />
          <path d="M40 28 L22 46 L40 64" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <rect x={200 - title.w / 2} y="20" width={title.w} height={title.h} rx="18" fill="#ffffff" fillOpacity="0.55" />
        <text
          x="200"
          y={20 + 11 + 19}
          textAnchor="middle"
          fontFamily={fredoka.style.fontFamily}
          fontWeight="600"
          fontSize="21"
          fill={INK}
        >
          {title.lines.map((line, j) => (
            <tspan key={j} x="200" dy={j ? 25 : 0}>
              {line}
            </tspan>
          ))}
        </text>

        <g
          role="button"
          tabIndex={0}
          aria-label="Accueil"
          className={styles.icon}
          onClick={onHome}
          onKeyDown={(e) => e.key === "Enter" && onHome()}
        >
          <rect x="336" y="10" width="60" height="70" fill="transparent" />
          <path
            d="M346 46 L364 30 L382 46 M350 43 L350 62 L378 62 L378 43 M359 62 L359 51 L369 51 L369 62"
            fill="none"
            stroke={INK}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      {/* Arrivée depuis le zoom sur l'île : sa couleur s'estompe */}
      {!arriveDir && <div className={styles.veil} style={{ background: land.ground }} />}
    </div>
  );
}
