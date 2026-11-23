"use client";

import { useLayoutEffect, useState } from "react";

// Les scènes sont dessinées dans un repère de 400 de large. Sur un écran plus large
// (ordinateur), on voit au-delà : ce hook donne la portion visible, arrondie à la
// centaine, pour y générer du décor au lieu de laisser des bandes vides.
export type Span = { xMin: number; xMax: number };

export const BAND = 100;
const PHONE: Span = { xMin: 0, xMax: 400 };

/**
 * @param mode "meet" : SVG plein écran en preserveAspectRatio meet (repère 400 × 800) ;
 *             "column" : colonne de largeur min(100vw, 50dvh) (repère de 400 de large).
 */
export function useViewportSpan(mode: "meet" | "column"): Span {
  const [span, setSpan] = useState<Span>(PHONE);

  useLayoutEffect(() => {
    function update() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const pxPerUnit = mode === "meet" ? Math.min(w / 400, h / 800) : Math.min(w, h / 2) / 400;
      // Demi-largeur visible, plus le décalage du traveling (30vw, cf. travel.ts) :
      // la scène qui glisse ne doit pas découvrir de bande vide.
      const half = (w / pxPerUnit / 2) * 1.6;
      const extra = Math.max(0, Math.ceil((half - 200) / BAND) * BAND);
      setSpan((s) => (s.xMin === -extra ? s : { xMin: -extra, xMax: 400 + extra }));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [mode]);

  return span;
}

// Bandes de décor à remplir de part et d'autre du cadre 0–400 (abscisse de départ).
export function sideBands(span: Span) {
  const bands: number[] = [];
  for (let x = -BAND; x >= span.xMin; x -= BAND) bands.push(x);
  for (let x = 400; x < span.xMax; x += BAND) bands.push(x);
  return bands;
}
