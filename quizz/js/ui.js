// Habillage commun des réponses : lettre, forme (SVG, pour un alignement exact) et couleur.
export const CHOICES = [
  { letter: 'A', shape: 'tri', cls: 'btn-a', color: 'var(--a)', path: 'M50 6 96 92H4z' },
  { letter: 'B', shape: 'dia', cls: 'btn-b', color: 'var(--b)', path: 'M50 2 98 50 50 98 2 50z' },
  { letter: 'C', shape: 'cir', cls: 'btn-c', color: 'var(--c)', path: 'M50 4a46 46 0 1 0 0 92a46 46 0 1 0 0-92z' },
  { letter: 'D', shape: 'sq', cls: 'btn-d', color: 'var(--d)', path: 'M8 8h84v84H8z' },
];

/**
 * Repère d'une réponse : la lettre inscrite dans sa forme.
 * Sur une tuile colorée, forme sombre et lettre de la couleur de la tuile ;
 * en version « solo » (fond sombre), forme colorée et lettre sombre.
 */
export function mark(i, { solo = false } = {}) {
  const ch = CHOICES[i];
  const m = document.createElement('span');
  m.className = `mark mark-${ch.shape}${solo ? ' solo' : ''}`;
  m.style.setProperty('--mc', ch.color);
  m.setAttribute('aria-hidden', 'true');
  m.innerHTML = `<svg viewBox="0 0 100 100"><path d="${ch.path}"/></svg><span class="ml">${ch.letter}</span>`;
  return m;
}

/** Affiche une seule section parmi celles données (par id). */
export function show(ids, visible) {
  for (const id of ids) document.getElementById(id).hidden = id !== visible;
}
