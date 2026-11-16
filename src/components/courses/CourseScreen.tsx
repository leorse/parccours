"use client";

import { useEffect, useMemo, useState } from "react";
import { Fredoka } from "next/font/google";
import styles from "./CourseScreen.module.css";
import { mulberry32, round } from "../space/sky";
import { wrap } from "../space/text";
import { SUBJECTS, YEARS } from "../subjects/data";
import { CHAPTERS } from "../chapters/data";
import { islandColor } from "../chapters/island";
import { getCourses } from "./data";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["600"] });

const OUTLINE = "#14102a";
const INK = "#1d2a4a";
const WOOD = "#dc9f66";
const WOOD_DARK = "#b8784a";

// Mélange deux couleurs hexadécimales (t = 0 → a, t = 1 → b).
function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

/* ------------------------------------------------------------------ */
/* Décor                                                               */
/* ------------------------------------------------------------------ */

const CLOUD = "M0 0 C-4 -18 14 -30 30 -22 C36 -42 68 -46 80 -26 C92 -38 118 -32 120 -14 C134 -14 142 -4 140 0 Z";

// Nuages : position de départ, taille, vitesse (s) et décalage de départ (s).
const CLOUDS = (() => {
  const rand = mulberry32(2024);
  return Array.from({ length: 11 }, (_, i) => ({
    y: round(105 + (i % 4) * 34 + rand() * 20),
    s: round(0.55 + rand() * 0.7),
    duration: round(60 + rand() * 60),
    // Décalages répartis régulièrement sur la durée : les nuages ne partent pas en paquet.
    delay: round(((i + rand() * 0.5) / 11) * 120),
  }));
})();

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

type Props = {
  subjectId: string;
  year: string;
  chapterIndex: number;
  onBack: () => void;
  onHome: () => void;
  /** Choix d'un cours (l'écran du parc viendra plus tard). */
  onSelectCourse?: (index: number) => void;
};

export function CourseScreen({ subjectId, year, chapterIndex, onBack, onHome, onSelectCourse }: Props) {
  const s = Math.max(0, SUBJECTS.findIndex((x) => x.id === subjectId));
  const y = Math.max(0, YEARS.indexOf(year));
  const subject = SUBJECTS[s];
  const chapterTitle = CHAPTERS[subject.id]?.[y]?.[chapterIndex] ?? "";
  const courses = getCourses(subject.id, YEARS[y], chapterIndex);
  const [picked, setPicked] = useState<number | null>(null);

  // La terre prend la couleur du continent choisi.
  const ground = islandColor(s, chapterIndex);
  const foliage = mix(ground, "#000000", 0.2);
  const shadow = mix(ground, "#000000", 0.25);

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

  function pick(i: number) {
    setPicked(i);
    window.setTimeout(() => setPicked(null), 450);
    onSelectCourse?.(i);
  }

  return (
    <div className={styles.root}>
      <svg className={styles.scene} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="pc-sky" x1="0" y1="-200" x2="0" y2="260" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#9fd0ee" />
            <stop offset="0.6" stopColor="#d9e8ee" />
            <stop offset="1" stopColor="#fbf0e0" />
          </linearGradient>
        </defs>

        {/* Ciel et nuages (débordent du cadre pour remplir tout l'écran) */}
        <rect x="-2000" y="-2000" width="4400" height="2300" fill="url(#pc-sky)" />
        <g aria-hidden="true">
          {CLOUDS.map((c, i) => (
            <g
              key={i}
              className={styles.cloud}
              style={{ animationDuration: `${c.duration}s`, animationDelay: `${-c.delay}s` }}
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
          className={styles.ground}
          d="M-2000 262 C-400 258 60 244 200 246 C340 248 700 256 2400 262 L2400 2000 L-2000 2000 Z"
          fill={ground}
          stroke={OUTLINE}
          strokeWidth="2.5"
        />

        <g aria-hidden="true">
          <RoundTree x={30} y={262} s={0.75} fill={foliage} />
          <Bush x={66} y={276} s={0.8} fill={foliage} />
          <ConeTree x={342} y={292} s={0.9} fill={foliage} />
          <RoundTree x={373} y={258} s={0.7} fill={foliage} />
          <Bush x={364} y={334} s={1} fill={foliage} />
          <RoundTree x={30} y={352} s={1.2} fill={foliage} />
          <Bush x={60} y={362} s={0.8} fill={foliage} />

          {/* Sentiers en pointillés qui mènent au poteau */}
          <g fill="none" stroke={OUTLINE} strokeWidth="2.5" strokeDasharray="0.1 8" strokeLinecap="round" opacity="0.8">
            <path d={`M-40 460 C40 470 120 ${postBottom - 30} ${POST_X - 32} ${postBottom - 14}`} />
            <path d={`M440 440 C360 470 280 ${postBottom - 30} ${POST_X + 32} ${postBottom - 14}`} />
            <path d={`M${POST_X + 34} ${postBottom + 4} C290 ${postBottom + 10} 340 ${postBottom + 40} 380 ${postBottom + 68}`} />
            <path d={`M${POST_X - 12} ${postBottom + 16} C150 ${postBottom + 50} 90 ${postBottom + 100} 60 ${postBottom + 130}`} />
          </g>

          {TUFTS.map(([x, ty]) => (
            <Tuft key={`${x}-${ty}`} x={x} y={ty} />
          ))}

          <ConeTree x={385} y={650} s={1.5} fill={foliage} />
          <Bush x={30} y={760} s={2.4} fill={foliage} />
          <Bush x={360} y={770} s={2.2} fill={foliage} />
        </g>

        {/* Poteau indicateur */}
        <ellipse cx={POST_X} cy={postBottom} rx="78" ry="9" fill={shadow} opacity="0.6" />
        <rect x={POST_X - 9} y={postTop} width="18" height={postBottom - postTop} rx="3" fill={WOOD} stroke={OUTLINE} strokeWidth="3" />
        <path d={`M${POST_X - 2} ${postTop + 30} l0 40 M${POST_X + 3} ${postBottom - 60} l0 30`} stroke={WOOD_DARK} strokeWidth="2" strokeLinecap="round" />
        <Tuft x={POST_X - 12} y={postBottom} />
        <Tuft x={POST_X + 14} y={postBottom + 1} />

        {signs.map((sg, i) => (
          <g key={i} className={styles.signDrop} style={{ animationDelay: `${0.25 + i * 0.12}s` }}>
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
      <div className={styles.veil} style={{ background: ground }} />
    </div>
  );
}
