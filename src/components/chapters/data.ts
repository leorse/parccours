// Chapitres par matière, puis par année (même ordre que YEARS : 6ème → 3ème).
// Contenu provisoire, inspiré des programmes du collège.
export const CHAPTERS: Record<string, string[][]> = {
  math: [
    ["Nombres entiers et décimaux", "Fractions", "Calcul et priorités opératoires", "Droites, cercles et angles", "Périmètres et aires", "Symétrie axiale"],
    ["Nombres relatifs", "Comparer et calculer avec des fractions", "Calcul littéral", "Proportionnalité", "Triangles et parallélogrammes", "Symétrie centrale"],
    ["Multiplier et diviser des relatifs", "Puissances", "Équations", "Théorème de Pythagore", "Proportionnalité et pourcentages", "Statistiques"],
    [
      "Divisibilité et nombres premiers",
      "Calcul sur les écritures fractionnaires et les puissances",
      "Proportionnalité et pourcentages",
      "Statistiques et probabilités",
      "Théorème de Thalès",
      "Fonctions",
      "Trigonométrie",
    ],
  ],
  francais: [
    ["Le conte et le merveilleux", "Récits de création", "Résister au plus fort : les fables", "Le monstre, aux limites de l'humain", "La phrase et ses constituants"],
    ["Le voyage et l'aventure", "Héros et héroïsme au Moyen Âge", "Vivre en société : la comédie", "Imaginer des univers nouveaux", "Les temps du récit"],
    ["Dire l'amour : la poésie lyrique", "La fiction pour interroger le réel", "Individu et société : la tragédie", "Informer, s'informer, déformer", "Le fantastique"],
    ["Se raconter : l'autobiographie", "Dénoncer les travers de la société", "La guerre au XXe siècle", "Visions poétiques du monde", "Préparer la rédaction du brevet"],
  ],
  "histoire-geo": [
    ["Les débuts de l'humanité", "Les premiers États, les premières écritures", "Le monde des cités grecques", "Rome, du mythe à l'histoire", "Habiter une métropole", "Habiter un espace de faible densité"],
    ["Byzance et l'Europe carolingienne", "Les débuts de l'islam", "Société, Église et pouvoir au Moyen Âge", "Les grandes découvertes", "La croissance démographique", "Des ressources limitées"],
    ["Le siècle des Lumières", "L'Europe et le monde au XIXe siècle", "La France au XIXe siècle", "L'urbanisation du monde", "Les mobilités humaines"],
    ["La Première Guerre mondiale", "Les régimes totalitaires", "La Seconde Guerre mondiale", "Le monde depuis 1945", "La France et l'Union européenne", "Les territoires de la France"],
  ],
  anglais: [
    ["Introducing yourself", "My family and friends", "School life", "Daily routine", "Food and drinks"],
    ["The simple past", "Holidays and travel", "Describing people", "Sports and hobbies", "Festivals around the world"],
    ["Life in the city", "Inventions and technology", "Talking about the future", "Heroes and legends", "The English-speaking world"],
    ["Getting ready for high school", "Fighting for rights", "Environment and the future", "Media and fake news", "Past and present"],
  ],
  svt: [
    ["Le vivant et sa diversité", "Classer les êtres vivants", "Les besoins des végétaux", "Le peuplement d'un milieu", "Roches et sous-sol"],
    ["Respiration et milieux de vie", "Digestion et nutrition", "Les paysages", "Météo et climat", "Reproduction sexuée et asexuée"],
    ["Séismes et volcans", "La tectonique des plaques", "Puberté et reproduction", "Le système nerveux", "Écosystèmes et activités humaines"],
    ["Génétique et hérédité", "L'évolution des espèces", "Immunité et vaccination", "Microbes et antibiotiques", "Le changement climatique"],
  ],
  "physique-chimie": [
    ["États de la matière", "Mélanges et solutions", "Mouvements et vitesses", "L'énergie et ses formes", "Signaux lumineux et sonores"],
    ["Changements d'état", "Masse et volume", "Circuits électriques simples", "La propagation de la lumière", "Le mouvement d'un objet"],
    ["Atomes et molécules", "Transformations chimiques", "Lois du courant électrique", "Vitesse de la lumière et du son", "Masse volumique"],
    ["Ions et pH", "Énergie et puissance électrique", "Gravitation et poids", "Énergie cinétique", "Signaux et ondes"],
  ],
};
