import type { CSSProperties } from "react";

// Traveling horizontal entre deux écrans : la caméra se déplace vers `dir`,
// donc le décor glisse dans l'autre sens, avec un fondu.
export type TravelDir = "left" | "right";

const DISTANCE = "30vw";

export function opposite(dir: TravelDir): TravelDir {
  return dir === "left" ? "right" : "left";
}

// Variables CSS lues par les animations travelIn / travelOut des écrans.
export function travelVars(dir: TravelDir): CSSProperties {
  const sign = dir === "left" ? "" : "-";
  return {
    // Sortie : la caméra part vers `dir`, le décor file de l'autre côté.
    ["--travel-to" as string]: `${sign}${DISTANCE}`,
    // Entrée : la caméra arrive en continuant vers `dir`, le décor vient du côté `dir`.
    ["--travel-from" as string]: `${sign ? "" : "-"}${DISTANCE}`,
  };
}
