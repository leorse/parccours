// Ciel étoilé partagé par les écrans « espace » (menu, choix des matières…).
// Repère 400 × 800.

// PRNG déterministe : mêmes étoiles côté serveur et client (pas d'erreur d'hydratation).
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
export const round = (n: number) => Math.round(n * 10) / 10;

export const STARS = Array.from({ length: 80 }, () => ({
  x: round(rand() * 400),
  y: round(rand() * 800),
  r: round(0.8 + rand() * 1.8),
  color: rand() > 0.55 ? "#f5c27a" : "#8f92dc",
  delay: round(rand() * 3),
}));

export const SPARKLES = [
  { x: 268, y: 128, s: 1.2, color: "#f5c27a" },
  { x: 160, y: 312, s: 1, color: "#e98bb0" },
  { x: 330, y: 420, s: 0.9, color: "#8f92dc" },
  { x: 60, y: 600, s: 1.1, color: "#f5c27a" },
  { x: 350, y: 690, s: 1, color: "#8f92dc" },
  { x: 110, y: 40, s: 0.8, color: "#8f92dc" },
  { x: 230, y: 760, s: 0.9, color: "#e98bb0" },
];

const SPARKLE_PATH =
  "M0 -6 Q1 -1 6 0 Q1 1 0 6 Q-1 1 -6 0 Q-1 -1 0 -6Z";

export function Sparkle({ x, y, s, color, className }: { x: number; y: number; s: number; color: string; className?: string }) {
  return (
    <path d={SPARKLE_PATH} fill={color} transform={`translate(${x} ${y}) scale(${s})`} className={className} />
  );
}
