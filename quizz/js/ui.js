// Habillage commun des réponses : lettre, forme et classe de couleur.
export const CHOICES = [
  { letter: 'A', shape: '▲', cls: 'btn-a' },
  { letter: 'B', shape: '◆', cls: 'btn-b' },
  { letter: 'C', shape: '●', cls: 'btn-c' },
  { letter: 'D', shape: '■', cls: 'btn-d' },
];

/** Affiche une seule section parmi celles données (par id). */
export function show(ids, visible) {
  for (const id of ids) document.getElementById(id).hidden = id !== visible;
}
