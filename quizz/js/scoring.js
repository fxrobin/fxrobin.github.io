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
  for (const [key, p] of Object.entries(players ?? {})) {
    rows.set(key, { key, name: p.name ?? key, r1: 0, r2: 0, r3: 0, total: 0, time: 0, rank: 0 });
    for (const uid of Object.keys(p.uids ?? {})) owner.set(uid, key);
    if (p.uid) owner.set(p.uid, key);
  }
  for (const [r, byQ] of Object.entries(answers ?? {})) {
    for (const [q, byUid] of Object.entries(byQ ?? {})) {
      const rev = reveals?.[r]?.[q];
      if (!rev) continue;
      for (const [uid, a] of Object.entries(byUid ?? {})) {
        const row = rows.get(owner.get(uid));
        if (!row || a?.c !== rev.correct) continue;
        const field = `r${r}`;
        if (field in row) row[field] += 1;
        row.total += 1;
        row.time += Math.max(0, (a.t ?? 0) - (rev.openedAt ?? 0));
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

/** CSV pour Excel FR : BOM, séparateur ;, fins de ligne CRLF, tri par prénom. */
export function toCsv(rows) {
  const lines = [...rows]
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    .map((r) => [r.name.replace(/[;\r\n]/g, ' '), r.r1, r.r2, r.r3, r.total].join(';'));
  return '﻿' + ['prenom;m1;m2;m3;total', ...lines].join('\r\n') + '\r\n';
}
