// Îles (= chapitres) générées de façon déterministe, dans un repère local centré sur (0, 0).

import { mulberry32, round } from "../space/sky";
import { blobPoints, closedSmooth } from "../subjects/planet";

const OUTLINE = "#14102a";

// Tons doux des îles (cf. maquette « choix chapitre ») ; décalés selon la matière.
// Partagé avec l'écran des cours, dont la prairie prend la couleur de l'île.
const ISLAND_COLORS = ["#8fc1ba", "#d9805f", "#86a97a", "#b9a6dc", "#e3c27a", "#e39aa8", "#8fb3e0"];
export const CLIFF = "#8a5a3a";

export function islandColor(subjectIndex: number, chapterIndex: number) {
  return ISLAND_COLORS[(chapterIndex + subjectIndex * 2) % ISLAND_COLORS.length];
}

export type IslandSpec = {
  d: string;
  ridges: string[];
  islets: string[];
};

/**
 * @param away côté opposé à l'étiquette (-1 : gauche, 1 : droite) ; les îlots y sont placés.
 */
export function generateIsland(seed: number, away: -1 | 1): IslandSpec {
  const rand = mulberry32(seed * 104729 + 7);
  const rx = 62 + rand() * 18;
  const ry = 54 + rand() * 16;
  const d = closedSmooth(blobPoints(rand, 0, 0, rx, ry, 12 + Math.floor(rand() * 4), 0.55));

  // Crêtes de montagnes, plutôt dans la moitié haute.
  const ridges = Array.from({ length: 1 + Math.floor(rand() * 2) }, (_, i) => {
    const x = (rand() - 0.5) * rx * 0.8 + (i ? away * 18 : 0);
    const y = -ry * 0.25 + (rand() - 0.5) * ry * 0.4;
    const h = 14 + rand() * 10;
    return (
      `M${round(x - 26)} ${round(y + 8)} ` +
      `Q${round(x - 16)} ${round(y - h * 0.4)} ${round(x - 8)} ${round(y - h)} ` +
      `Q${round(x - 2)} ${round(y - 4)} ${round(x + 4)} ${round(y - h * 0.55)} ` +
      `Q${round(x + 14)} ${round(y - 2)} ${round(x + 24)} ${round(y + 10)}`
    );
  });

  const islets = Array.from({ length: Math.floor(rand() * 4) }, () => {
    const x = away * (rx * 0.75 + rand() * 30);
    const y = (rand() - 0.5) * ry * 1.8;
    const s = 6 + rand() * 12;
    return closedSmooth(blobPoints(rand, x, y, s * 1.3, s, 7, 0.5));
  });

  return { d, ridges, islets };
}

function Land({ d, fill, cliff }: { d: string; fill: string; cliff: string }) {
  return (
    <>
      {/* Haut-fond clair autour de l'île */}
      <path d={d} fill="none" stroke="#8f8fe0" strokeOpacity="0.14" strokeWidth="22" strokeLinejoin="round" />
      {/* Falaise : copie décalée plus sombre */}
      <path d={d} transform="translate(2 7)" fill={cliff} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      <path d={d} fill={fill} stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
    </>
  );
}

export function IslandArt({ spec, fill, cliff }: { spec: IslandSpec; fill: string; cliff: string }) {
  return (
    <g>
      {spec.islets.map((d) => (
        <Land key={d} d={d} fill={fill} cliff={cliff} />
      ))}
      <Land d={spec.d} fill={fill} cliff={cliff} />
      {spec.ridges.map((d) => (
        <path key={d} d={d} fill="none" stroke={OUTLINE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </g>
  );
}
