import { YEARS } from "../subjects/data";

// Cours de chaque chapitre, indexés par "matière/année/n° de chapitre".
// Contenu provisoire : seuls les chapitres de MATH · 3ème sont détaillés.
const COURSES: Record<string, string[]> = {
  "math/3ème/0": [
    "Rechercher des diviseurs",
    "Décomposer un nombre en produit de facteurs premiers",
    "Simplifier une fraction pour la rendre irréductible",
  ],
  "math/3ème/1": [
    "Additionner et soustraire des fractions",
    "Multiplier et diviser des fractions",
    "Calculer avec des puissances",
    "Utiliser la notation scientifique",
  ],
  "math/3ème/2": [
    "Reconnaître une situation de proportionnalité",
    "Calculer une quatrième proportionnelle",
    "Appliquer un pourcentage",
    "Calculer une évolution en pourcentage",
  ],
  "math/3ème/3": [
    "Calculer une moyenne et une médiane",
    "Déterminer l'étendue d'une série",
    "Calculer une probabilité",
  ],
  "math/3ème/4": [
    "Énoncer le théorème de Thalès",
    "Calculer une longueur",
    "Montrer que deux droites sont parallèles",
  ],
  "math/3ème/5": ["Notion de fonction", "Image et antécédent", "Fonctions linéaires et affines"],
  "math/3ème/6": ["Cosinus, sinus et tangente", "Calculer une longueur", "Calculer un angle"],
};

// En attendant le vrai contenu des autres chapitres.
const FALLBACK = ["Découvrir le chapitre", "S'entraîner", "Faire le bilan"];

export function getCourses(subjectId: string, year: string, chapterIndex: number): string[] {
  const y = YEARS.includes(year) ? year : YEARS[YEARS.length - 1];
  return COURSES[`${subjectId}/${y}/${chapterIndex}`] ?? FALLBACK;
}
