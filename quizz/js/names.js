// Prénoms des élèves : nettoyage, clé unique, validation. Module pur.

export const NAME_TAKEN = "Ce prénom est déjà pris : ajoute l'initiale de ton nom.";

const MAX = 20;

/** Espaces de bord retirés, espaces multiples réduits, 20 caractères max. */
export function cleanName(raw) {
  return String(raw ?? '').trim().replace(/\s+/g, ' ').slice(0, MAX).trim();
}

/** Clé insensible à la casse et aux accents, utilisable dans un chemin Realtime Database. */
const LIGATURES = { æ: 'ae', Æ: 'ae', œ: 'oe', Œ: 'oe', ß: 'ss', ł: 'l', Ł: 'l', ø: 'o', Ø: 'o', đ: 'd', Đ: 'd' };

export function nameKey(name) {
  return cleanName(name)
    .replace(/[æÆœŒßłŁøØđĐ]/g, (c) => LIGATURES[c])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** null si le prénom est utilisable, sinon le message à afficher. */
export function validateName(name) {
  const clean = cleanName(name);
  if (!clean) return 'Écris ton prénom.';
  if (!/\p{L}/u.test(clean)) return 'Ton prénom doit contenir au moins une lettre.';
  if (!/[a-z]/.test(nameKey(clean))) return 'Écris ton prénom en lettres latines.';
  return null;
}
