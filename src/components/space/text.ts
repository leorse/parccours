// Retour à la ligne approximatif pour du texte SVG (pas de mesure réelle) :
// on coupe entre les mots dès qu'une ligne dépasse `maxChars` caractères.
export function wrap(text: string, maxChars: number) {
  const lines: string[] = [];
  let cur = "";
  for (const word of text.split(" ")) {
    const next = cur ? `${cur} ${word}` : word;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
