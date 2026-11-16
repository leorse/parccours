"use client";

import { useEffect, useRef, useState } from "react";
import { Cinzel_Decorative } from "next/font/google";
import styles from "./MenuScreen.module.css";
import {
  Arch,
  GateLeaf,
  MascotBody,
  MascotPointingArm,
  Planet,
  PortalGlow,
  PORTAL_CLIP,
  SPARKLES,
  STARS,
  Sparkle,
} from "./art";

const cinzel = Cinzel_Decorative({ subsets: ["latin"], weight: ["700", "900"] });

type Phase = "idle" | "opening" | "entering" | "inside";

// Durées alignées sur les transitions de MenuScreen.module.css.
const OPENING_MS = 1350; // grille + saut de la mascotte
const ENTERING_MS = 1400; // zoom dans le portail + flash

type Props = {
  /** Appelé une fois la traversée du portail terminée. */
  onEntered?: () => void;
};

export function MenuScreen({ onEntered }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  function enter() {
    if (phase !== "idle") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("inside");
      onEntered?.();
      return;
    }

    setPhase("opening");
    timers.current.push(
      window.setTimeout(() => setPhase("entering"), OPENING_MS),
      window.setTimeout(() => {
        setPhase("inside");
        onEntered?.();
      }, OPENING_MS + ENTERING_MS),
    );
  }

  const className = [
    styles.root,
    (phase === "opening" || phase === "entering") && styles.open,
    phase === "entering" && styles.enter,
    phase === "inside" && styles.inside,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      role="button"
      tabIndex={0}
      aria-label="Entrer dans ParcCours"
      onClick={enter}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          enter();
        }
      }}
    >
      {/* Ciel étoilé : remplit tout l'écran quel que soit le format */}
      <svg className={styles.layer} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g className={styles.stars}>
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
        </g>
      </svg>

      {/* Scène : toujours entière, calée en bas de l'écran */}
      <svg
        className={`${styles.layer} ${styles.layerScene}`}
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="pc-portal-clip">
            <path d={PORTAL_CLIP} />
          </clipPath>
          <radialGradient id="pc-portal-grad" cx="200" cy="520" r="300" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fffaf0" />
            <stop offset="0.2" stopColor="#e2ccff" />
            <stop offset="0.55" stopColor="#8f6cf0" />
            <stop offset="1" stopColor="#3d2f8f" />
          </radialGradient>
        </defs>

        <g className={styles.zoom}>
          {SPARKLES.map((s, i) => (
            <Sparkle key={i} {...s} className={styles.twinkle} />
          ))}

          <Planet id="p-blue" cx={85} cy={88} r={26} base="#7fa8e0" detail="#5b86c4" kind="land" className={styles.float} delay={0} />
          <Planet id="p-green" cx={318} cy={77} r={22} base="#6fc28a" detail="#3f9a5e" kind="land" className={styles.float} delay={2} />
          <Planet id="p-orange" cx={41} cy={165} r={12} base="#f0a24a" detail="#d8823a" kind="bands" className={styles.float} delay={4} />
          <Planet id="p-pink" cx={358} cy={174} r={17} base="#ec8fb2" detail="#d06a92" kind="bands" className={styles.float} delay={1} />
          <Planet id="p-earth" cx={238} cy={349} r={23} base="#5aa0d8" detail="#5fb56e" kind="land" className={styles.float} delay={3} />

          <PortalGlow className={styles.portal} swirlClassName={styles.swirl} />

          <g className={styles.gateLeft}>
            <GateLeaf />
          </g>
          <g className={styles.gateRight}>
            <g transform="matrix(-1 0 0 1 400 0)">
              <GateLeaf />
            </g>
          </g>

          <Arch fontFamily={cinzel.style.fontFamily} />

          <g className={styles.mascot}>
            <g className={styles.bob}>
              <MascotBody />
              <g className={styles.arm}>
                <MascotPointingArm />
              </g>
            </g>
          </g>

          <text
            x="200"
            y="792"
            textAnchor="middle"
            fontSize="14"
            fill="#e9dcff"
            letterSpacing="1"
            className={styles.hint}
          >
            Touche l&apos;écran pour entrer
          </text>
        </g>
      </svg>

      <div className={styles.flash} />
    </div>
  );
}
