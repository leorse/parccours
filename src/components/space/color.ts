// Mélange deux couleurs hexadécimales (t = 0 → a, t = 1 → b).
export function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

// Teintes du décor (prairie, feuillages, sentier) dérivées de la couleur du continent,
// pour que l'écran des panneaux et le parc restent dans la même gamme que l'île.
export function landPalette(ground: string) {
  return {
    ground,
    foliage: mix(ground, "#000000", 0.2),
    foliageLight: mix(ground, "#ffffff", 0.3),
    foliageDark: mix(ground, "#000000", 0.38),
    shadow: mix(ground, "#000000", 0.25),
    path: mix(ground, "#fff6e6", 0.62),
  };
}
