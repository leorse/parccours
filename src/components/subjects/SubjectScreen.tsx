"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Fredoka } from "next/font/google";
import styles from "./SubjectScreen.module.css";
import { STARS } from "../space/sky";
import { PlanetArt, PlanetDefs } from "./planet";
import { PLANETS, SUBJECTS, YEARS } from "./data";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["600"] });

type Move = "prev" | "next" | "up" | "down";
type Pos = { s: number; y: number };
type Phase = "browse" | "zooming" | "zoomed";

// Planète centrale (repère 400 × 800).
const CX = 200;
const CY = 430;
const SCALE = 1.46; // rayon 146

const SLIDE_MS = 450; // aligné sur les animations de glissement du CSS
const ZOOM_MS = 1100; // aligné sur la transition .zoomer
const SWIPE_PX = 40;

const ENTER: Record<Move, string> = {
  next: styles.enterFromRight,
  prev: styles.enterFromLeft,
  up: styles.enterFromTop,
  down: styles.enterFromBottom,
};
const EXIT: Record<Move, string> = {
  next: styles.exitToLeft,
  prev: styles.exitToRight,
  up: styles.exitToBottom,
  down: styles.exitToTop,
};

const CHEVRONS: Record<Move, { d: string; hit: [number, number]; label: string }> = {
  up: { d: "M168 140 L200 104 L232 140", hit: [200, 122], label: "Année précédente" },
  down: { d: "M168 672 L200 708 L232 672", hit: [200, 690], label: "Année suivante" },
  prev: { d: "M44 394 L14 430 L44 466", hit: [29, 430], label: "Matière précédente" },
  next: { d: "M356 394 L386 430 L356 466", hit: [371, 430], label: "Matière suivante" },
};

type Props = {
  /** Arrivée depuis le menu : fondu depuis le flash du portail. */
  intro?: boolean;
  /** Appelé quand le zoom sur la planète choisie est terminé. */
  onSelect?: (subjectId: string, year: string) => void;
  /** Planète affichée au départ (par défaut : MATH · 3ème). */
  initialSubjectId?: string;
  initialYear?: string;
  /** Retour depuis les chapitres : on part zoomé dans la planète et on dézoome. */
  returning?: boolean;
};

function initialPos(subjectId?: string, year?: string): Pos {
  const s = SUBJECTS.findIndex((x) => x.id === subjectId);
  const y = year ? YEARS.indexOf(year) : -1;
  return { s: Math.max(0, s), y: y >= 0 ? y : YEARS.length - 1 };
}

export function SubjectScreen({ intro = false, onSelect, initialSubjectId, initialYear, returning = false }: Props) {
  const [pos, setPos] = useState<Pos>(() => initialPos(initialSubjectId, initialYear));
  const [move, setMove] = useState<Move | null>(null);
  const [leaving, setLeaving] = useState<(Pos & { move: Move }) | null>(null);
  const [phase, setPhase] = useState<Phase>(returning ? "zoomed" : "browse");

  // Retour : on laisse le navigateur peindre l'état zoomé, puis on lance le dézoom.
  useEffect(() => {
    if (!returning) return;
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setPhase("browse"));
    });
    return () => cancelAnimationFrame(raf);
  }, [returning]);

  const busy = useRef(false);
  const swiped = useRef(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const n = SUBJECTS.length;
  const subject = SUBJECTS[pos.s];
  const label = `${subject.name} · ${YEARS[pos.y]}`;

  const can: Record<Move, boolean> = {
    prev: true,
    next: true,
    up: pos.y > 0,
    down: pos.y < YEARS.length - 1,
  };

  function go(m: Move) {
    if (busy.current || phase !== "browse" || !can[m]) return;
    const next: Pos =
      m === "next" ? { ...pos, s: (pos.s + 1) % n }
      : m === "prev" ? { ...pos, s: (pos.s - 1 + n) % n }
      : m === "up" ? { ...pos, y: pos.y - 1 }
      : { ...pos, y: pos.y + 1 };

    busy.current = true;
    setLeaving({ ...pos, move: m });
    setMove(m);
    setPos(next);
    timers.current.push(
      window.setTimeout(() => {
        setLeaving(null);
        busy.current = false;
      }, SLIDE_MS),
    );
  }

  function select() {
    if (busy.current || phase !== "browse") return;
    setPhase("zooming");
    timers.current.push(
      window.setTimeout(() => {
        setPhase("zoomed");
        onSelect?.(subject.id, YEARS[pos.y]);
      }, ZOOM_MS),
    );
  }

  // Clavier : flèches pour naviguer, Entrée/Espace pour choisir.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const moves: Record<string, Move> = { ArrowLeft: "prev", ArrowRight: "next", ArrowUp: "up", ArrowDown: "down" };
      if (moves[e.key]) {
        e.preventDefault();
        go(moves[e.key]);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Largeur du cartouche ajustée au texte (et remesurée une fois la police chargée).
  const textRef = useRef<SVGTextElement>(null);
  const [labelWidth, setLabelWidth] = useState(label.length * 15);
  useLayoutEffect(() => {
    const measure = () => textRef.current && setLabelWidth(textRef.current.getBBox().width);
    measure();
    document.fonts?.ready.then(measure);
  }, [label]);

  const prevS = (pos.s - 1 + n) % n;
  const nextS = (pos.s + 1) % n;

  const className = [
    styles.root,
    intro && styles.intro,
    phase !== "browse" && styles.zooming,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      onPointerDown={(e) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
        swiped.current = false;
      }}
      onPointerUp={(e) => {
        const start = pointerStart.current;
        pointerStart.current = null;
        if (!start) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return;
        swiped.current = true;
        // On « pousse » la planète : glisser vers la gauche amène la matière de droite.
        if (Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? "next" : "prev");
        else go(dy < 0 ? "down" : "up");
      }}
    >
      <svg className={styles.layer} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={s.color}
            className={styles.twinkle}
            style={{ animationDelay: `${-s.delay}s` }}
          />
        ))}
      </svg>

      <svg className={styles.layer} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid meet">
        <PlanetDefs />

        <g className={styles.chrome}>
          {/* Matières voisines qui dépassent des bords */}
          <g key={`prev-${prevS}-${pos.y}`} className={styles.neighbor}>
            <g transform="translate(-10 690) scale(0.9)">
              <PlanetArt spec={PLANETS[prevS][pos.y]} glow={false} />
            </g>
          </g>
          <g key={`next-${nextS}-${pos.y}`} className={styles.neighbor}>
            <g transform="translate(415 215) scale(0.85)">
              <PlanetArt spec={PLANETS[nextS][pos.y]} glow={false} />
            </g>
          </g>


          <g key={label} className={styles.label}>
            <rect
              x={CX - labelWidth / 2 - 18}
              y="172"
              width={labelWidth + 36}
              height="46"
              rx="11"
              fill="#c9c6ee"
              fillOpacity="0.8"
            />
            <text
              ref={textRef}
              x={CX}
              y="204"
              textAnchor="middle"
              fontFamily={fredoka.style.fontFamily}
              fontWeight="600"
              fontSize="26"
              fill="#14102a"
            >
              {label}
            </text>
          </g>
        </g>

        <g className={styles.zoomer}>
          <g className={styles.arrive}>
            {leaving && (
              <g key={`out-${leaving.s}-${leaving.y}`} className={EXIT[leaving.move]}>
                <g transform={`translate(${CX} ${CY}) scale(${SCALE})`}>
                  <PlanetArt spec={PLANETS[leaving.s][leaving.y]} />
                </g>
              </g>
            )}
            <g key={`in-${pos.s}-${pos.y}`} className={move ? ENTER[move] : undefined}>
              <g className={styles.float}>
                <g
                  transform={`translate(${CX} ${CY}) scale(${SCALE})`}
                  role="button"
                  aria-label={`Choisir ${label}`}
                  className={styles.planet}
                  onClick={() => {
                    if (!swiped.current) select();
                  }}
                >
                  <PlanetArt spec={PLANETS[pos.s][pos.y]} />
                </g>
              </g>
            </g>
          </g>
        </g>

        {/* Flèches au premier plan : l'anneau de la planète ne doit pas les recouvrir */}
        <g className={styles.chrome}>
          {(Object.keys(CHEVRONS) as Move[]).map((m) =>
            can[m] ? (
              <g
                key={m}
                role="button"
                aria-label={CHEVRONS[m].label}
                className={styles.chevron}
                onClick={(e) => {
                  e.stopPropagation();
                  go(m);
                }}
              >
                <rect x={CHEVRONS[m].hit[0] - 40} y={CHEVRONS[m].hit[1] - 40} width="80" height="80" fill="transparent" stroke="none" />
                <path d={CHEVRONS[m].d} />
              </g>
            ) : null,
          )}
        </g>
      </svg>

      <div className={styles.flash} />
    </div>
  );
}
