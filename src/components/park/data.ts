import { mulberry32 } from "../space/sky";

// Contenu provisoire d'un cours : ses parties (nombre de leçons dans chacune)
// et le nombre de leçons déjà vues, en dur en attendant le suivi par utilisateur.
export type ParkData = {
  /** Nombre de leçons de chaque partie, de la première (en bas du parc) à la dernière. */
  parts: number[];
  /** Leçons déjà vues, dans l'ordre ; la suivante est la seule sélectionnable. */
  seen: number;
};

// Progression en dur : "matière/année/n° de chapitre/n° de cours" → leçons vues.
const SEEN: Record<string, number> = {
  "math/3ème/0/0": 5,
};
const DEFAULT_SEEN = 2;

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

export function parkKey(subjectId: string, year: string, chapterIndex: number, courseIndex: number) {
  return `${subjectId}/${year}/${chapterIndex}/${courseIndex}`;
}

export function getPark(key: string): ParkData {
  const rand = mulberry32(hash(key));
  const parts = Array.from({ length: 2 + Math.floor(rand() * 2) }, () => 3 + Math.floor(rand() * 3));
  const total = parts.reduce((a, b) => a + b, 0);
  return { parts, seen: Math.min(SEEN[key] ?? DEFAULT_SEEN, total) };
}
