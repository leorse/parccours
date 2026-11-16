import { generatePlanet, type Palette, type PlanetSpec } from "./planet";

export type Subject = { id: string; name: string; palette: Palette };

// Gauche ↔ droite : les matières (navigation en boucle).
export const SUBJECTS: Subject[] = [
  {
    id: "math",
    name: "MATH",
    palette: { ocean: "#9a8fd0", swirl: "#e6e1ff", lands: ["#2f6b4a", "#d9733f", "#e7c352", "#c9a6e8"], cliff: "#7a4a2a", river: "#f3e3c0", ring: "#d9d2ff" },
  },
  {
    id: "francais",
    name: "FRANÇAIS",
    palette: { ocean: "#3f8f9a", swirl: "#bfeef0", lands: ["#f08a6c", "#f5d9a8", "#d9667f"], cliff: "#8a3f3a", river: "#fff1dc", ring: "#ffd6b8" },
  },
  {
    id: "histoire-geo",
    name: "HISTOIRE-GÉO",
    palette: { ocean: "#d2a463", swirl: "#fbe6c0", lands: ["#8a4b2a", "#6f8f3a", "#e8d39a"], cliff: "#4f2a18", river: "#9fd3e0", ring: "#f0d9a8" },
  },
  {
    id: "anglais",
    name: "ANGLAIS",
    palette: { ocean: "#4f6fd8", swirl: "#c8d4ff", lands: ["#e2504f", "#f2efe6", "#2a3f8f"], cliff: "#1e2a5f", river: "#9cc4ff", ring: "#f2efe6" },
  },
  {
    id: "svt",
    name: "SVT",
    palette: { ocean: "#6fc2b0", swirl: "#e0fff5", lands: ["#3d8a3d", "#9ccf5a", "#f2c94c"], cliff: "#2c5a2c", river: "#d8fff2", ring: "#c8f2a8" },
  },
  {
    id: "physique-chimie",
    name: "PHYSIQUE-CHIMIE",
    palette: { ocean: "#2d2f6b", swirl: "#7f84d8", lands: ["#ff9f43", "#54e0d0", "#c56cf0"], cliff: "#14163a", river: "#fff3b0", ring: "#54e0d0" },
  },
];

// Haut ↕ bas : les années, de la 6ème (en haut) à la 3ème (en bas).
export const YEARS = ["6ème", "5ème", "4ème", "3ème"];

// Une planète différente pour chaque couple (matière, année).
export const PLANETS: PlanetSpec[][] = SUBJECTS.map((subject, s) =>
  YEARS.map((_, y) => generatePlanet(s * 100 + y + 1, subject.palette)),
);
