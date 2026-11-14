// Page verrouillée sur un jeu : un site qui présente un jeu le fait lancer par
// une adresse, sans bibliothèque ni fichier à ouvrir.
//
//   /toje/?media=/releases/rick/rick-dangerous.fd&titre=Rick+Dangerous
//
// `media` se répète pour un jeu sur plusieurs disquettes, dans l'ordre : la
// première démarre au lecteur 1, la deuxième attend au lecteur 2 (un jeu qui la
// cherche là la trouve), et chacune reste à portée de main sous « Disquettes du
// jeu » — un jeu qui demande « insérez la disquette 2 » au lecteur 1 l'y reçoit
// sans redémarrer. Une carte SDDrive (.sd) ou une cartouche (.rom) démarre de
// même. L'extension décide, comme pour la bibliothèque.
//
// Un média peut être hébergé ailleurs sur le web, et zippé :
//
//   /toje/?media=https://exemple.org/jeux/mon-jeu.zip
//
// L'archive est ouverte dans la page ; ses disquettes, cartes et cartouches
// prennent sa place dans la liste, dans l'ordre naturel de leurs noms (disk1,
// disk2…). Le site qui l'héberge doit autoriser la lecture depuis une autre
// page (en-tête CORS) : GitHub (raw.githubusercontent.com, Pages) le fait.

import { formatOf } from './library.js';
import { titleOf, baseName } from './titles.js';
import { isZip, unzip } from './zip-reader.js';

/** Disquette (.fd, .sap), carte (sd), cartouche (rom), archive (zip), ou null. */
function kindOf(name) {
  if (/\.zip$/i.test(name)) return 'zip';
  if (/\.sap$/i.test(name)) return 'disk';
  const format = formatOf(name);
  return format === 'fd' ? 'disk' : format;
}
export const isDisk = name => kindOf(name) === 'disk';

/** Nom de fichier d'une adresse de média : son dernier segment, décodé. */
function fileName(url) {
  return decodeURIComponent(new URL(url).pathname.split('/').pop());
}

/**
 * Le jeu imposé par l'adresse de la page, ou null : { title, key, media }, où
 * media = [{ url, name }]. Seuls les médias http(s) d'extension connue comptent
 * (un chemin relatif se résout contre la page).
 */
export function lockedGame(search, base) {
  const params = new URLSearchParams(search);
  const media = [];
  for (const value of params.getAll('media')) {
    let url;
    try { url = new URL(value, base); } catch { continue; }
    if (!/^https?:$/.test(url.protocol)) continue;
    const name = fileName(url.href);
    if (kindOf(name)) media.push({ url: url.href, name });
  }
  if (media.length === 0) return null;
  const title = (params.get('titre') || '').trim() || titleOf(media[0].name);
  return { title, key: baseName(media[0].name), media };
}

/** Les parties d'un jeu verrouillé restent les siennes : préfixe dans le magasin. */
export function scopedStore(store, prefix) {
  return {
    get: key => store.get(prefix + key),
    put: (key, value) => store.put(prefix + key, value),
    remove: key => store.remove(prefix + key),
    keys: async p => (await store.keys(prefix + p)).map(k => String(k).slice(prefix.length)),
  };
}

/** Média lançable (pas une archive) : ce qu'on retient dans un zip. */
const playable = name => { const k = kindOf(name); return k !== null && k !== 'zip'; };

/** Octets d'une adresse, avec une erreur qui dit quoi faire. */
async function download(m) {
  let response;
  try {
    response = await fetch(m.url);
  } catch (e) {
    // fetch ne distingue pas réseau coupé et refus CORS : le navigateur cache
    // la cause. Une autre origine est le cas qui se règle chez l'hébergeur.
    const other = typeof location !== 'undefined' && new URL(m.url).origin !== location.origin;
    throw new Error(other
      ? `${m.name} : ${new URL(m.url).host} refuse la lecture depuis cette page (pas d'en-tête CORS), ou est injoignable`
      : `${m.name} : ${e.message}`);
  }
  if (!response.ok) throw new Error(`${m.name} : HTTP ${response.status}`);
  return new Int8Array(await response.arrayBuffer());
}

/**
 * Un média téléchargé, ou les médias d'une archive : [{ name, bytes }]. Une
 * archive se reconnaît à son nom ou à sa signature (un lien de téléchargement
 * n'a pas toujours la bonne extension).
 */
export async function expand(name, bytes) {
  if (kindOf(name) !== 'zip' && !isZip(bytes)) return [{ name, bytes }];
  const inside = await unzip(bytes, playable);
  if (inside.length === 0) throw new Error(`${name} : aucune disquette, carte ou cartouche dans l'archive`);
  return inside;
}

/** Télécharge les médias du jeu ; rend [{ name, bytes, label }] dans l'ordre. */
export async function fetchMedia(game) {
  const groups = await Promise.all(game.media.map(async m => expand(m.name, await download(m))));
  const files = groups.flat();
  const disks = files.filter(f => isDisk(f.name));
  return files.map(f => {
    const rank = disks.indexOf(f);
    const label = disks.length > 1 && rank >= 0 ? `${game.title} — disquette ${rank + 1}` : game.title;
    return { ...f, label };
  });
}

/**
 * Rangée « Disquettes du jeu » : chaque disquette, avec de quoi la glisser au
 * lecteur 1 ou 2. `insert(entry, drive)` fait l'insertion. Masquée pour un jeu
 * d'une seule disquette.
 */
export function renderGameDisks(container, entries, insert) {
  const disks = entries.filter(e => isDisk(e.name));
  container.hidden = disks.length < 2;
  container.replaceChildren();
  if (container.hidden) return;
  const title = document.createElement('p');
  title.className = 'menu-note';
  title.textContent = 'Disquettes du jeu : la glisser au lecteur demandé, sans redémarrer';
  container.append(title);
  disks.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'opt-row';
    const text = document.createElement('span');
    text.className = 'opt-text';
    text.textContent = `Disquette ${i + 1}`;
    const seg = document.createElement('span');
    seg.className = 'segmented';
    for (const drive of [0, 1]) {
      const b = document.createElement('button');
      b.className = 'seg-item';
      b.textContent = `Lecteur ${drive + 1}`;
      b.title = `Glisse la disquette ${i + 1} dans le lecteur ${drive + 1}`;
      b.addEventListener('click', () => insert(entry, drive));
      seg.append(b);
    }
    row.append(text, seg);
    container.append(row);
  });
}
