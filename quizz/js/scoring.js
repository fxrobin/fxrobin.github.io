// Calcul des notes à partir des données Realtime Database. Module pur.
// players : {key: {name, uid, uids: {uid: true}}}
// answers : {r: {q: {uid: {c, t}}}}
// reveals : {r: {q: {correct, openedAt}}}

/**
 * @returns {{key: string, name: string, r1: number, r2: number, r3: number, total: number, time: number, rank: number}[]}
 *   triées par total décroissant puis temps cumulé croissant (départage d'affichage).
 */
export function computeScores({ players, answers, reveals }) {
  const owner = new Map(); // uid -> key
  const rows = new Map();
  const entries = Object.entries(players ?? {});
  for (const [key, p] of entries) {
    rows.set(key, { key, name: p.name ?? key, r1: 0, r2: 0, r3: 0, total: 0, time: 0, rank: 0 });
    for (const uid of Object.keys(p.uids ?? {})) owner.set(uid, key);
  }
  // L'appareil actuel d'un joueur l'emporte sur un historique (uid libéré puis réutilisé).
  for (const [key, p] of entries) if (p.uid) owner.set(p.uid, key);

  for (const [r, byQ] of Object.entries(answers ?? {})) {
    for (const [q, byUid] of Object.entries(byQ ?? {})) {
      const rev = reveals?.[r]?.[q];
      if (!rev) continue;
      const best = new Map(); // key -> délai de la réponse juste la plus rapide : un point au plus par joueur
      for (const [uid, a] of Object.entries(byUid ?? {})) {
        const key = owner.get(uid);
        if (!rows.has(key) || a?.c !== rev.correct) continue;
        const delay = Math.max(0, (a.t ?? 0) - (rev.openedAt ?? 0));
        best.set(key, Math.min(best.get(key) ?? Infinity, delay));
      }
      for (const [key, delay] of best) {
        const row = rows.get(key);
        if (`r${r}` in row) row[`r${r}`] += 1;
        row.total += 1;
        row.time += delay;
      }
    }
  }
  const sorted = [...rows.values()].sort((a, b) => b.total - a.total || a.time - b.time || a.name.localeCompare(b.name, 'fr'));
  sorted.forEach((row, i) => {
    const prev = sorted[i - 1];
    row.rank = prev && prev.total === row.total && prev.time === row.time ? prev.rank : i + 1;
  });
  return sorted;
}

/** Texte saisi par un élève : jamais interprété comme une formule par le tableur. */
function csvText(s) {
  const clean = String(s).replace(/[;\r\n]/g, ' ');
  return /^[=+\-@\t]/.test(clean) ? `'${clean}` : clean;
}

/** CSV pour Excel FR : BOM, séparateur ;, fins de ligne CRLF, tri par prénom. */
export function toCsv(rows) {
  const lines = [...rows]
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    .map((r) => [csvText(r.name), r.r1, r.r2, r.r3, r.total].join(';'));
  return '﻿' + ['prenom;m1;m2;m3;total', ...lines].join('\r\n') + '\r\n';
}
