// Éléments SVG du menu, dessinés dans un repère 400 × 800 (portrait téléphone).
// Composants purs (sans hooks) : les animations sont pilotées par les classes CSS
// posées par MenuScreen.

export const IRON = "#17122b";
export const GOLD = "#f0b871";
const FUR = "#d8843a";
const FUR_LIGHT = "#fff6ea";
const PINK = "#f4b9a6";
const OUTLINE = "#4a2a14";

// Centre du portail (intérieur de l'arche), cible du zoom.
export const PORTAL_CX = 200;
export const PORTAL_CY = 520;

import { round } from "../space/sky";

export { STARS, SPARKLES, Sparkle } from "../space/sky";

/* ------------------------------------------------------------------ */
/* Planètes                                                            */
/* ------------------------------------------------------------------ */

type PlanetProps = {
  id: string;
  cx: number;
  cy: number;
  r: number;
  base: string;
  detail: string;
  kind: "land" | "bands";
  className?: string;
  delay?: number;
};

// Formes en coordonnées unitaires (rayon 1), mises à l'échelle par `r`.
const LAND = [
  "M-0.7 -0.3 C-0.5 -0.7 -0.1 -0.6 -0.15 -0.3 C-0.2 0 -0.45 0.05 -0.4 0.35 C-0.38 0.6 -0.7 0.5 -0.75 0.2 Z",
  "M0.1 -0.75 C0.4 -0.8 0.6 -0.5 0.45 -0.3 C0.3 -0.15 0.55 0 0.7 0.1 C0.75 0.4 0.4 0.6 0.25 0.4 C0.1 0.2 0.15 0 0 -0.1 C-0.1 -0.3 -0.05 -0.6 0.1 -0.75 Z",
  "M-0.1 0.55 C0.05 0.5 0.15 0.65 0.05 0.8 C-0.1 0.85 -0.2 0.7 -0.1 0.55 Z",
];

export function Planet({ id, cx, cy, r, base, detail, kind, className, delay = 0 }: PlanetProps) {
  return (
    <g className={className} style={{ animationDelay: `${-delay}s` }}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <radialGradient id={`${id}-shade`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#0b0820" stopOpacity="0.45" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={base} />
      <g clipPath={`url(#${id}-clip)`}>
        <g transform={`translate(${cx} ${cy}) scale(${r})`} fill={detail}>
          {kind === "land" ? (
            LAND.map((d) => <path key={d} d={d} />)
          ) : (
            <>
              <ellipse cx="0" cy="-0.5" rx="1.2" ry="0.1" />
              <ellipse cx="-0.2" cy="-0.05" rx="0.9" ry="0.13" />
              <ellipse cx="0.3" cy="0.4" rx="1" ry="0.09" />
              <ellipse cx="-0.4" cy="0.72" rx="0.6" ry="0.07" />
            </>
          )}
        </g>
      </g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-shade)`} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Portail : intérieur lumineux                                        */
/* ------------------------------------------------------------------ */

// Intérieur de l'arche, jusqu'au sol.
export const PORTAL_CLIP = "M15 800 L15 470 A185 220 0 0 1 385 470 L385 800 Z";

function spiralArm(offset: number) {
  let d = "";
  for (let i = 0; i <= 180; i++) {
    const t = (i / 180) * 4 * Math.PI;
    const r = 4 + t * 15;
    const x = PORTAL_CX + r * Math.cos(t + offset);
    const y = PORTAL_CY + r * Math.sin(t + offset);
    d += `${i ? "L" : "M"}${round(x)} ${round(y)} `;
  }
  return d;
}

const SPIRAL_ARMS = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map(spiralArm);

export function PortalGlow({ className, swirlClassName }: { className?: string; swirlClassName?: string }) {
  return (
    <g className={className} clipPath="url(#pc-portal-clip)">
      <rect x="0" y="200" width="400" height="600" fill="url(#pc-portal-grad)" />
      <g className={swirlClassName}>
        {SPIRAL_ARMS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#fffaf0"
            strokeOpacity={i % 2 ? 0.35 : 0.55}
            strokeWidth={i % 2 ? 5 : 8}
            strokeLinecap="round"
          />
        ))}
      </g>
      <circle cx={PORTAL_CX} cy={PORTAL_CY} r="40" fill="#fffdf5" opacity="0.9" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Arche, piliers et ferronnerie                                       */
/* ------------------------------------------------------------------ */

const CURL = "M0 0 C0 -16 16 -22 24 -12 C30 -4 22 6 15 1 C10 -3 15 -9 19 -6";

// Volute posée sur le bord extérieur de l'arche, à l'angle `deg` (0° = gauche, 90° = sommet).
function ArchCurl({ deg, scale = 1 }: { deg: number; scale?: number }) {
  const a = (deg * Math.PI) / 180;
  const x = 200 - 226 * Math.cos(a);
  const y = 470 - 276 * Math.sin(a);
  return (
    <path
      d={CURL}
      transform={`translate(${round(x)} ${round(y)}) rotate(${-(90 - deg)}) scale(${scale})`}
      fill="none"
      stroke={IRON}
      strokeWidth={3.5 / scale}
      strokeLinecap="round"
    />
  );
}

function HalfOrnaments() {
  return (
    <>
      <ArchCurl deg={26} />
      <ArchCurl deg={40} scale={1.15} />
      <ArchCurl deg={55} />
      <ArchCurl deg={67} scale={0.9} />
      {/* Grande volute qui part du médaillon */}
      <path
        d="M172 176 C150 150 116 160 120 188 C123 206 146 204 144 188 C143 179 133 179 132 186"
        fill="none"
        stroke={IRON}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M174 192 C160 200 150 206 132 206" fill="none" stroke={IRON} strokeWidth="3" strokeLinecap="round" />
      {/* Pilier */}
      <rect x="15" y="420" width="19" height="345" fill={IRON} />
      <rect x="12" y="556" width="25" height="9" rx="2" fill={GOLD} stroke={IRON} strokeWidth="2" />
      <rect x="12" y="640" width="25" height="9" rx="2" fill={GOLD} stroke={IRON} strokeWidth="2" />
      <rect x="9" y="742" width="31" height="26" rx="3" fill={IRON} />
    </>
  );
}

// Petites volutes sur le montant doré (dessinées par-dessus le bandeau).
function HalfFront() {
  return (
    <g fill="none" stroke={IRON} strokeWidth="2.5" strokeLinecap="round">
      <path d="M8 520 C-4 506 4 492 12 500 C16 504 12 510 8 507" />
      <path d="M8 610 C-4 596 4 582 12 590 C16 594 12 600 8 597" />
      <path d="M8 700 C-4 686 4 672 12 680 C16 684 12 690 8 687" />
      <circle cx="12.4" cy="364" r="5" fill={IRON} stroke="none" />
    </g>
  );
}

export function Arch({ fontFamily }: { fontFamily: string }) {
  return (
    <g>
      <HalfOrnaments />
      <g transform="matrix(-1 0 0 1 400 0)">
        <HalfOrnaments />
      </g>

      {/* Bandeau doré avec ses montants */}
      <path
        d="M-30 800 L-30 470 A230 280 0 0 1 430 470 L430 800 L385 800 L385 470 A185 220 0 0 0 15 470 L15 800 Z"
        fill={GOLD}
        stroke={IRON}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* Filets intérieurs pour le relief */}
      <path d="M-24 470 A224 273 0 0 1 424 470" fill="none" stroke={IRON} strokeOpacity="0.55" strokeWidth="1.5" />
      <path d="M391 470 A191 227 0 0 0 9 470" fill="none" stroke={IRON} strokeOpacity="0.55" strokeWidth="1.5" />
      <HalfFront />
      <g transform="matrix(-1 0 0 1 400 0)">
        <HalfFront />
      </g>

      <path id="pc-arch-text" d="M7 470 A193 236 0 0 1 393 470" fill="none" />
      <text
        fontFamily={fontFamily}
        fontSize="52"
        fontWeight="900"
        letterSpacing="3"
        fill={IRON}
        stroke="#fde7b8"
        strokeWidth="2"
        paintOrder="stroke"
      >
        <textPath href="#pc-arch-text" startOffset="50%" textAnchor="middle">
          PARCCOURS
        </textPath>
      </text>

      {/* Médaillon « CC » : un C pour parc, un C pour cours */}
      <circle cx="200" cy="168" r="31" fill={GOLD} stroke={IRON} strokeWidth="4" />
      <circle cx="200" cy="168" r="24" fill="none" stroke={IRON} strokeWidth="1.5" />
      <text
        x="191"
        y="182"
        fontFamily={fontFamily}
        fontSize="38"
        fontWeight="700"
        fill={IRON}
        textAnchor="middle"
      >
        C
      </text>
      <text
        x="209"
        y="182"
        fontFamily={fontFamily}
        fontSize="38"
        fontWeight="700"
        fill={IRON}
        textAnchor="middle"
      >
        C
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Battant de grille (gauche ; le droit est son miroir)                */
/* ------------------------------------------------------------------ */

const HINGE = 34;
const LATCH = 199;
const GROUND = 758;

const topY = (x: number) => 432 - 58 * Math.sin((Math.PI * (x - HINGE)) / (LATCH - HINGE));

function railPath(offset: number) {
  let d = "";
  for (let x = HINGE; x <= LATCH; x += 5) {
    d += `${x === HINGE ? "M" : "L"}${x} ${round(topY(x) + offset)} `;
  }
  return d + `L${LATCH} ${round(topY(LATCH) + offset)}`;
}

const BARS = Array.from({ length: 13 }, (_, i) => 40 + i * 12.5);
const RINGS = Array.from({ length: 13 }, (_, i) => 46 + i * 12);
const LYRES = [72, 116, 160];

export function GateLeaf() {
  return (
    <g stroke={IRON} fill="none" strokeLinecap="round">
      {/* Barreaux et pointes */}
      {BARS.map((x) => (
        <g key={x}>
          <line x1={x} y1={round(topY(x))} x2={x} y2={GROUND - 4} strokeWidth="3.5" />
          <path
            d={`M${x} ${round(topY(x) - 11)} L${x + 3.5} ${round(topY(x) - 4)} L${x} ${round(topY(x))} L${x - 3.5} ${round(topY(x) - 4)} Z`}
            fill={IRON}
            strokeWidth="1"
          />
        </g>
      ))}
      {/* Montants */}
      <line x1={HINGE + 2} y1={round(topY(HINGE) - 6)} x2={HINGE + 2} y2={GROUND} strokeWidth="6" />
      <line x1={LATCH - 2} y1={round(topY(LATCH) - 6)} x2={LATCH - 2} y2={GROUND} strokeWidth="6" />
      {/* Traverses du haut, en arc */}
      <path d={railPath(14)} strokeWidth="5" />
      <path d={railPath(26)} strokeWidth="3" />
      {/* Volutes en lyre */}
      {LYRES.map((cx) => (
        <g key={cx} strokeWidth="3">
          <path d={`M${cx - 15} 498 C${cx - 24} 470 ${cx} 460 ${cx} 478 C${cx} 487 ${cx - 9} 488 ${cx - 9} 481`} />
          <path d={`M${cx + 15} 498 C${cx + 24} 470 ${cx} 460 ${cx} 478 C${cx} 487 ${cx + 9} 488 ${cx + 9} 481`} />
        </g>
      ))}
      <line x1={HINGE} y1="500" x2={LATCH} y2="500" strokeWidth="4" />
      {/* Frise d'anneaux */}
      <line x1={HINGE} y1="628" x2={LATCH} y2="628" strokeWidth="5" />
      {RINGS.map((x) => (
        <circle key={x} cx={x} cy="652" r="5.5" strokeWidth="2.5" />
      ))}
      <line x1={HINGE} y1="676" x2={LATCH} y2="676" strokeWidth="5" />
      {/* Bas */}
      <line x1={HINGE} y1="744" x2={LATCH} y2="744" strokeWidth="4" />
      <line x1={HINGE} y1={GROUND} x2={LATCH} y2={GROUND} strokeWidth="6" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Mascotte : cochon d'Inde avec sac à dos                             */
/* Repère local : pieds en (0, 0), tête vers y négatif.                */
/* ------------------------------------------------------------------ */

export const MASCOT_X = 200;
export const MASCOT_Y = 765;

export function MascotBody() {
  return (
    <g transform={`translate(${MASCOT_X} ${MASCOT_Y})`}>
      <ellipse cx="0" cy="2" rx="95" ry="12" fill="#0b0820" opacity="0.3" />

      {/* Sac à dos, derrière le corps */}
      <rect x="-104" y="-150" width="58" height="112" rx="16" fill="#3a9db0" stroke={OUTLINE} strokeWidth="3" />
      <rect x="-108" y="-96" width="34" height="40" rx="9" fill="#2f8697" stroke={OUTLINE} strokeWidth="3" />
      <line x1="-104" y1="-84" x2="-78" y2="-84" stroke={OUTLINE} strokeWidth="2" />

      {/* Contour commun (oreilles, tête, corps) puis remplissage par-dessus */}
      <g fill={OUTLINE} stroke={OUTLINE} strokeWidth="7">
        <ellipse cx="-52" cy="-212" rx="17" ry="14" />
        <ellipse cx="52" cy="-212" rx="17" ry="14" />
        <ellipse cx="0" cy="-170" rx="68" ry="58" />
        <ellipse cx="0" cy="-75" rx="72" ry="78" />
      </g>
      <g fill={FUR}>
        <ellipse cx="-52" cy="-212" rx="17" ry="14" />
        <ellipse cx="52" cy="-212" rx="17" ry="14" />
        <ellipse cx="0" cy="-75" rx="72" ry="78" />
        <ellipse cx="0" cy="-170" rx="68" ry="58" />
      </g>
      <ellipse cx="-53" cy="-211" rx="9" ry="7" fill="#e8a39a" />
      <ellipse cx="53" cy="-211" rx="9" ry="7" fill="#e8a39a" />

      {/* Liste blanche du visage et ventre */}
      <ellipse cx="0" cy="-66" rx="54" ry="64" fill={FUR_LIGHT} />
      <path
        d="M-8 -226 Q0 -232 8 -226 L20 -182 Q46 -162 38 -132 Q30 -110 0 -108 Q-30 -110 -38 -132 Q-46 -162 -20 -182 Z"
        fill={FUR_LIGHT}
      />

      {/* Épi sur le haut de la tête */}
      <path
        d="M-16 -224 Q-14 -242 -4 -230 Q0 -248 6 -230 Q15 -242 16 -224"
        fill={FUR}
        stroke={OUTLINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Yeux */}
      <circle cx="-27" cy="-178" r="8.5" fill="#2b1a10" />
      <circle cx="27" cy="-178" r="8.5" fill="#2b1a10" />
      <circle cx="-29.5" cy="-181" r="2.8" fill="#fff" />
      <circle cx="24.5" cy="-181" r="2.8" fill="#fff" />

      {/* Joues */}
      <ellipse cx="-42" cy="-150" rx="10" ry="6" fill="#f08c8c" opacity="0.35" />
      <ellipse cx="42" cy="-150" rx="10" ry="6" fill="#f08c8c" opacity="0.35" />

      {/* Nez et bouche */}
      <path d="M-9 -156 Q0 -162 9 -156 Q4 -147 0 -147 Q-4 -147 -9 -156 Z" fill="#ea9a9a" stroke={OUTLINE} strokeWidth="2" />
      <line x1="0" y1="-147" x2="0" y2="-141" stroke={OUTLINE} strokeWidth="2" />
      <path d="M-15 -140 Q0 -136 15 -140 Q12 -122 0 -121 Q-12 -122 -15 -140 Z" fill="#7a2a2a" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="0" cy="-126" rx="7" ry="4" fill="#ee8a8a" />

      {/* Pieds */}
      <ellipse cx="-30" cy="-4" rx="22" ry="9" fill={PINK} stroke={OUTLINE} strokeWidth="3" />
      <ellipse cx="30" cy="-4" rx="22" ry="9" fill={PINK} stroke={OUTLINE} strokeWidth="3" />

      {/* Bretelle et bras qui la tient */}
      <path d="M-56 -130 Q-66 -90 -56 -48" fill="none" stroke={OUTLINE} strokeWidth="11" strokeLinecap="round" />
      <path d="M-56 -130 Q-66 -90 -56 -48" fill="none" stroke="#2f8697" strokeWidth="6" strokeLinecap="round" />
      <line x1="-58" y1="-112" x2="-46" y2="-90" stroke={OUTLINE} strokeWidth="22" strokeLinecap="round" />
      <line x1="-58" y1="-112" x2="-46" y2="-90" stroke={FUR} strokeWidth="16" strokeLinecap="round" />
      <circle cx="-45" cy="-87" r="9" fill={PINK} stroke={OUTLINE} strokeWidth="3" />
    </g>
  );
}

// Bras qui montre le portail (animé séparément, pivot à l'épaule).
export const SHOULDER_X = MASCOT_X + 50;
export const SHOULDER_Y = MASCOT_Y - 112;

export function MascotPointingArm() {
  return (
    <g transform={`translate(${MASCOT_X} ${MASCOT_Y})`}>
      <line x1="50" y1="-112" x2="92" y2="-128" stroke={OUTLINE} strokeWidth="22" strokeLinecap="round" />
      <line x1="50" y1="-112" x2="92" y2="-128" stroke={FUR} strokeWidth="16" strokeLinecap="round" />
      <line x1="100" y1="-134" x2="112" y2="-148" stroke={OUTLINE} strokeWidth="8" strokeLinecap="round" />
      <line x1="100" y1="-134" x2="112" y2="-148" stroke={PINK} strokeWidth="4" strokeLinecap="round" />
      <circle cx="96" cy="-130" r="9.5" fill={PINK} stroke={OUTLINE} strokeWidth="3" />
    </g>
  );
}
