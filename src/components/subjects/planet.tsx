// Planètes générées de façon déterministe : chaque (matière, année) a sa graine,
// donc sa propre géographie, identique côté serveur et client.
// Tout est dessiné dans un repère local de rayon 100 centré sur (0, 0) ;
// on positionne/agrandit ensuite avec un transform.

import { mulberry32, round } from "../space/sky";

export type Palette = {
  ocean: string;
  swirl: string;
  lands: string[];
  cliff: string;
  river: string;
  ring: string;
};

export type Pt = [number, number];

type Blob = { d: string; fill: string; rivers: string[] };

export type PlanetSpec = {
  palette: Palette;
  blobs: Blob[];
  islands: Blob[];
  swirls: string[];
  cap?: string;
  ring?: { tilt: number; rx: number; ry: number };
};

const OUTLINE = "#14102a";

// Courbe fermée lissée (Catmull-Rom → Bézier) passant par les points.
export function closedSmooth(pts: Pt[]) {
  const n = pts.length;
  const f = (p: Pt) => `${round(p[0])} ${round(p[1])}`;
  let d = `M${f(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1)} ${f(c2)} ${f(p2)}`;
  }
  return d + " Z";
}

export function blobPoints(rand: () => number, cx: number, cy: number, rx: number, ry: number, k: number, jitter: number): Pt[] {
  const offset = rand() * Math.PI * 2;
  return Array.from({ length: k }, (_, i) => {
    const a = offset + (i / k) * Math.PI * 2 + (rand() - 0.5) * 0.4;
    const r = 1 - jitter / 2 + rand() * jitter;
    return [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r];
  });
}

function makeRivers(rand: () => number, cx: number, cy: number, size: number) {
  const count = rand() > 0.4 ? 1 + Math.floor(rand() * 2) : 0;
  return Array.from({ length: count }, () => {
    const p = (s: number): Pt => [cx + (rand() - 0.5) * size * s, cy + (rand() - 0.5) * size * s];
    const [a, b, c] = [p(1.1), p(0.6), p(1.1)];
    return `M${round(a[0])} ${round(a[1])} Q${round(b[0])} ${round(b[1])} ${round(c[0])} ${round(c[1])}`;
  });
}

export function generatePlanet(seed: number, palette: Palette): PlanetSpec {
  const rand = mulberry32(seed * 7919 + 13);

  // Continents : positions tirées avec un écart minimal pour éviter les gros amas.
  const blobCount = 4 + Math.floor(rand() * 4);
  const centers: { x: number; y: number; s: number }[] = [];
  for (let tries = 0; centers.length < blobCount && tries < 300; tries++) {
    const a = rand() * Math.PI * 2;
    const dist = Math.sqrt(rand()) * 85;
    const s = 16 + rand() * 26;
    const x = Math.cos(a) * dist;
    const y = Math.sin(a) * dist;
    if (centers.every((c) => Math.hypot(c.x - x, c.y - y) > (c.s + s) * 0.9)) {
      centers.push({ x, y, s });
    }
  }

  const blobs = centers.map(({ x, y, s }, i) => {
    const stretch = 0.7 + rand() * 0.6;
    return {
      d: closedSmooth(blobPoints(rand, x, y, s * stretch, s / stretch, 9 + Math.floor(rand() * 4), 0.75)),
      fill: palette.lands[i % palette.lands.length],
      rivers: makeRivers(rand, x, y, s),
    };
  });

  const islands = Array.from({ length: 2 + Math.floor(rand() * 4) }, () => {
    const a = rand() * Math.PI * 2;
    const dist = 20 + rand() * 70;
    const s = 4 + rand() * 7;
    const x = Math.cos(a) * dist;
    const y = Math.sin(a) * dist;
    return {
      d: closedSmooth(blobPoints(rand, x, y, s, s * (0.6 + rand() * 0.5), 6, 0.5)),
      fill: palette.lands[Math.floor(rand() * palette.lands.length)],
      rivers: [],
    };
  });

  const swirls = Array.from({ length: 4 + Math.floor(rand() * 3) }, () => {
    const x = (rand() - 0.5) * 150;
    const y = (rand() - 0.5) * 150;
    const w = 18 + rand() * 30;
    const h = (rand() - 0.5) * 16;
    return `M${round(x)} ${round(y)} q${round(w / 2)} ${round(h)} ${round(w)} 0 t${round(w * 0.6)} ${round(-h / 2)}`;
  });

  // Calotte polaire, en haut ou en bas.
  let cap: string | undefined;
  if (rand() > 0.45) {
    const top = rand() > 0.5;
    cap = closedSmooth(blobPoints(rand, 0, top ? -98 : 98, 70, 24, 10, 0.5));
  }

  let ring: PlanetSpec["ring"];
  if (rand() > 0.45) {
    ring = { tilt: round((rand() - 0.5) * 50), rx: round(150 + rand() * 25), ry: round(24 + rand() * 14) };
  }

  return { palette, blobs, islands, swirls, cap, ring };
}

/* ------------------------------------------------------------------ */
/* Rendu                                                               */
/* ------------------------------------------------------------------ */

// Définitions partagées par toutes les planètes d'un même <svg>.
// Elles sont exprimées dans le repère local (rayon 100), valable pour chaque planète.
export function PlanetDefs() {
  return (
    <defs>
      <clipPath id="pc-planet-clip">
        <circle r="100" />
      </clipPath>
      <clipPath id="pc-ring-back">
        <rect x="-300" y="-300" width="600" height="300" />
      </clipPath>
      <clipPath id="pc-ring-front">
        <rect x="-300" y="0" width="600" height="300" />
      </clipPath>
      <radialGradient id="pc-planet-shade" cx="35%" cy="30%" r="80%">
        <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
        <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#0b0820" stopOpacity="0.5" />
      </radialGradient>
      <radialGradient id="pc-planet-glow">
        <stop offset="0.78" stopColor="#e9e4ff" stopOpacity="0.55" />
        <stop offset="1" stopColor="#e9e4ff" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

function Ring({ spec, half }: { spec: NonNullable<PlanetSpec["ring"]>; half: "back" | "front" }) {
  return (
    <g transform={`rotate(${spec.tilt})`}>
      <g clipPath={`url(#pc-ring-${half})`} fill="none">
        <ellipse rx={spec.rx} ry={spec.ry} stroke={OUTLINE} strokeOpacity="0.5" strokeWidth="13" />
        {/* Couleur héritée du groupe parent (palette.ring) */}
        <ellipse rx={spec.rx} ry={spec.ry} strokeWidth="10" />
        <ellipse rx={spec.rx + 12} ry={spec.ry + 3} stroke={OUTLINE} strokeOpacity="0.4" strokeWidth="2.5" />
      </g>
    </g>
  );
}

function Land({ blob, palette }: { blob: Blob; palette: Palette }) {
  return (
    <g>
      {/* Falaise : copie décalée et plus sombre pour l'effet de relief */}
      <path d={blob.d} transform="translate(1.8 3)" fill={palette.cliff} stroke={OUTLINE} strokeWidth="2.5" />
      <path d={blob.d} fill={blob.fill} stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
      {blob.rivers.map((r) => (
        <path key={r} d={r} fill="none" stroke={palette.river} strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
      ))}
    </g>
  );
}

export function PlanetArt({ spec, glow = true }: { spec: PlanetSpec; glow?: boolean }) {
  const { palette } = spec;
  return (
    <g>
      {glow && <circle r="122" fill="url(#pc-planet-glow)" />}
      {spec.ring && (
        <g stroke={palette.ring} strokeOpacity="0.75">
          <Ring spec={spec.ring} half="back" />
        </g>
      )}
      <circle r="100" fill={palette.ocean} />
      <g clipPath="url(#pc-planet-clip)">
        {spec.swirls.map((d) => (
          <path key={d} d={d} fill="none" stroke={palette.swirl} strokeWidth="4" strokeLinecap="round" opacity="0.55" />
        ))}
        {spec.cap && <path d={spec.cap} fill="#f4f1ff" stroke={OUTLINE} strokeWidth="2" />}
        {spec.blobs.map((b) => (
          <Land key={b.d} blob={b} palette={palette} />
        ))}
        {spec.islands.map((b) => (
          <Land key={b.d} blob={b} palette={palette} />
        ))}
      </g>
      <circle r="100" fill="url(#pc-planet-shade)" />
      <circle r="100" fill="none" stroke={OUTLINE} strokeWidth="3.5" />
      {spec.ring && (
        <g stroke={palette.ring} strokeOpacity="0.85">
          <Ring spec={spec.ring} half="front" />
        </g>
      )}
    </g>
  );
}
