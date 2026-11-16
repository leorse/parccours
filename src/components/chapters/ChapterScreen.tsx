"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Fredoka } from "next/font/google";
import styles from "./ChapterScreen.module.css";
import { STARS, mulberry32, round } from "../space/sky";
import { wrap } from "../space/text";
import { SUBJECTS, YEARS } from "../subjects/data";
import { CHAPTERS } from "./data";
import { CLIFF, IslandArt, generateIsland, islandColor } from "./island";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["600"] });

// Repère du contenu défilant : largeur 400, une île tous les STEP.
const TOP = 205; // centre de la première île (sous l'en-tête)
const STEP = 165;
const BOTTOM = 130;
const ISLAND_LEFT_X = 125;
const ISLAND_RIGHT_X = 272;

// Étiquettes : retour à la ligne approximatif (Fredoka 18px ≈ 10 unités par caractère).
const FONT_SIZE = 18;
const LINE_H = 22;
const CHAR_W = 10;
const MAX_CHARS = 18;

const ZOOM_MS = 900; // aligné sur la transition .zoomed du CSS

type Props = {
  subjectId: string;
  year: string;
  onBack: () => void;
  onHome: () => void;
  /** Appelé quand le zoom sur l'île choisie est terminé. */
  onSelectChapter?: (index: number) => void;
  /** Retour depuis les cours : on part zoomé sur cette île et on dézoome. */
  returnFrom?: number;
};

export function ChapterScreen({ subjectId, year, onBack, onHome, onSelectChapter, returnFrom }: Props) {
  const s = Math.max(0, SUBJECTS.findIndex((x) => x.id === subjectId));
  const y = Math.max(0, YEARS.indexOf(year));
  const subject = SUBJECTS[s];
  const chapters = CHAPTERS[subject.id]?.[y] ?? [];
  const returning = returnFrom !== undefined;

  // Île sur laquelle on est zoomé (choix en cours, ou retour depuis les cours).
  const [zoomTo, setZoomTo] = useState<number | null>(returning ? returnFrom : null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<SVGSVGElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Backspace") onBack();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const height = TOP + Math.max(0, chapters.length - 1) * STEP + BOTTOM;

  // Retour : on fait défiler jusqu'à l'île d'où l'on vient, puis on dézoome.
  useLayoutEffect(() => {
    if (!returning) return;
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (scroller && content) {
      const unit = content.clientWidth / 400;
      scroller.scrollTop = (TOP + returnFrom * STEP) * unit - scroller.clientHeight / 2;
    }
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setZoomTo(null));
    });
    return () => cancelAnimationFrame(raf);
  }, [returning, returnFrom]);

  // Cartouche de l'en-tête : largeur estimée (Fredoka 24px ≈ 12 unités par caractère),
  // texte resserré s'il dépasse la place laissée entre les deux icônes.
  const PILL_MAX = 236;
  const pillTitle = `${subject.name} · Chapitres`;
  const pillText = pillTitle.length * 12;
  const pill = {
    title: pillTitle,
    w: Math.min(pillText + 32, PILL_MAX),
    squeeze: pillText + 32 > PILL_MAX ? PILL_MAX - 28 : undefined,
  };

  const layout = useMemo(
    () =>
      chapters.map((title, i) => {
        // Alternance : île à droite / étiquette à gauche, puis l'inverse.
        const islandRight = i % 2 === 0;
        const cx = islandRight ? ISLAND_RIGHT_X : ISLAND_LEFT_X;
        const cy = TOP + i * STEP;
        const lines = wrap(title, MAX_CHARS);
        const w = Math.min(220, Math.max(...lines.map((l) => l.length)) * CHAR_W + 32);
        const h = lines.length * LINE_H + 22;
        // L'étiquette chevauche le bord de l'île (comme sur la maquette), sans sortir de l'écran.
        const lx = islandRight ? Math.max(16 + w / 2, cx - 40 - w / 2) : Math.min(384 - w / 2, cx + 40 + w / 2);
        return {
          title,
          cx,
          cy,
          lines,
          w,
          h,
          lx,
          ly: cy - 4,
          spec: generateIsland(s * 1000 + y * 100 + i + 1, islandRight ? 1 : -1),
          fill: islandColor(s, i),
        };
      }),
    [chapters, s, y],
  );

  // Vaguelettes décoratives sur la mer.
  const waves = useMemo(() => {
    const rand = mulberry32(s * 31 + y * 7 + 3);
    return Array.from({ length: Math.round(height / 120) }, () => ({
      x: round(rand() * 360),
      y: round(60 + rand() * (height - 60)),
    }));
  }, [s, y, height]);

  function pick(i: number) {
    if (zoomTo !== null) return;
    setZoomTo(i);
    timers.current.push(window.setTimeout(() => onSelectChapter?.(i), ZOOM_MS));
  }

  const rootClass = [styles.root, returning && styles.returning, zoomTo !== null && styles.leaving]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <svg className={styles.sky} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {STARS.map((st, i) => (
          <circle
            key={i}
            cx={st.x}
            cy={st.y}
            r={st.r}
            fill={st.color}
            className={styles.twinkle}
            style={{ animationDelay: `${-st.delay}s` }}
          />
        ))}
      </svg>

      <div className={styles.scroller} ref={scrollerRef}>
        <svg
          ref={contentRef}
          className={styles.content}
          viewBox={`0 0 400 ${height}`}
          style={{ aspectRatio: `400 / ${height}` }}
        >
          <g className={styles.descend}>
            <g className={styles.sea}>
              {waves.map((w, i) => (
                <path
                  key={i}
                  d={`M${w.x} ${w.y} q5 -5 10 0 t10 0 t10 0 M${w.x + 8} ${w.y + 9} q5 -5 10 0 t10 0`}
                  fill="none"
                  stroke="#4a4f9a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              ))}

              {/* Chemin en pointillés d'un chapitre au suivant */}
              {layout.slice(1).map((b, i) => {
                const a = layout[i];
                const mx = (a.cx + b.cx) / 2 + (i % 2 ? 30 : -30);
                const my = (a.cy + b.cy) / 2;
                return (
                  <path
                    key={i}
                    d={`M${a.cx} ${a.cy} Q${mx} ${my} ${b.cx} ${b.cy}`}
                    fill="none"
                    stroke="#b3a6e6"
                    strokeOpacity="0.75"
                    strokeWidth="3.5"
                    strokeDasharray="0.1 9"
                    strokeLinecap="round"
                  />
                );
              })}
            </g>

            {layout.map((c, i) => (
              <g
                key={i}
                className={`${styles.zoomWrap} ${zoomTo === i ? styles.zoomed : ""} ${zoomTo !== null && zoomTo !== i ? styles.faded : ""}`}
                style={{ transformOrigin: `${c.cx}px ${c.cy}px` }}
              >
                <g
                  role="button"
                  tabIndex={0}
                  aria-label={c.title}
                  className={styles.chapter}
                  onClick={() => pick(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      pick(i);
                    }
                  }}
                >
                  <g className={styles.rise} style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
                    <g transform={`translate(${c.cx} ${c.cy})`}>
                      <IslandArt spec={c.spec} fill={c.fill} cliff={CLIFF} />
                    </g>
                    <g className={styles.tag}>
                      <rect
                        x={c.lx - c.w / 2}
                        y={c.ly - c.h / 2}
                        width={c.w}
                        height={c.h}
                        rx="16"
                        fill="#fbf3dc"
                        stroke="#c9a46a"
                        strokeWidth="3"
                      />
                      <text
                        x={c.lx}
                        y={c.ly - ((c.lines.length - 1) * LINE_H) / 2 + FONT_SIZE * 0.35}
                        textAnchor="middle"
                        fontFamily={fredoka.style.fontFamily}
                        fontWeight="600"
                        fontSize={FONT_SIZE}
                        fill="#14102a"
                      >
                        {c.lines.map((line, j) => (
                          <tspan key={j} x={c.lx} dy={j ? LINE_H : 0}>
                            {line}
                          </tspan>
                        ))}
                      </text>
                    </g>
                  </g>
                </g>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* En-tête fixe : retour, matière, accueil */}
      <div className={styles.header}>
        <svg viewBox="0 0 400 120" className={styles.headerSvg}>
          <g
            role="button"
            tabIndex={0}
            aria-label="Retour aux matières"
            className={styles.icon}
            onClick={onBack}
            onKeyDown={(e) => e.key === "Enter" && onBack()}
          >
            <rect x="8" y="12" width="70" height="80" fill="transparent" />
            <path d="M58 22 L22 54 L58 86" fill="none" stroke="#0d0a1f" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          <rect x={200 - pill.w / 2} y="32" width={pill.w} height="44" rx="11" fill="#c9c6ee" fillOpacity="0.8" />
          <text
            x="200"
            y="63"
            textAnchor="middle"
            fontFamily={fredoka.style.fontFamily}
            fontWeight="600"
            fontSize="24"
            fill="#14102a"
            textLength={pill.squeeze}
            lengthAdjust="spacingAndGlyphs"
          >
            {pill.title}
          </text>

          <g
            role="button"
            tabIndex={0}
            aria-label="Accueil"
            className={styles.icon}
            onClick={onHome}
            onKeyDown={(e) => e.key === "Enter" && onHome()}
          >
            <rect x="322" y="12" width="70" height="80" fill="transparent" />
            <path d="M357 30 L385 56 L377 56 L377 80 L337 80 L337 56 L329 56 Z" fill="#0d0a1f" stroke="#0d0a1f" strokeWidth="4" strokeLinejoin="round" />
            <rect x="351" y="64" width="12" height="16" fill="#3a3270" />
          </g>
        </svg>
      </div>

      {/* Arrivée depuis le zoom sur la planète : la couleur de l'océan s'estompe */}
      <div className={styles.veil} style={{ background: subject.palette.ocean }} />
    </div>
  );
}
