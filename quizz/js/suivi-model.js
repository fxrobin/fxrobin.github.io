// Tableau de bord du prof : état de chaque élève pendant une manche. Module pur, sans Firebase.
// players  : {key: {name, uid, free, uids: {uid: true}}}
// present  : Set des uid connectés (noeud /presence)
// answers  : réponses de la manche en cours {q: {uid: {c, t}}}
// reveals  : corrections de la manche en cours {q: {correct, openedAt}}
// acks     : téléphones prêts pour la question en cours {uid: true}
// game     : noeud /game ; questions : questions de la manche (parseQuiz)

const LIVE = new Set(['ready', 'question', 'reveal']);

/** Bonne réponse d'une question : celle enregistrée à la correction, sinon celle du fichier. */
function correctOf(q, reveals, questions) {
  return reveals?.[q]?.correct ?? questions[q]?.correct ?? null;
}

/** Heure d'ouverture d'une question, pour mesurer le délai de réponse. */
function openedAtOf(q, reveals, game) {
  if (reveals?.[q]?.openedAt) return reveals[q].openedAt;
  return Number(q) === game?.q ? game.openedAt || 0 : 0;
}

/**
 * @returns {{rows: object[], alerts: {level: 'ko'|'warn'|'info', text: string}[], stats: object}}
 */
export function followUp({ players = {}, present = new Set(), answers = {}, reveals = {}, acks = {}, game = null, questions = [] }) {
  const phase = game?.phase ?? 'idle';
  const curQ = LIVE.has(phase) ? game.q : null;
  const askReady = phase === 'ready' || phase === 'question'; // les confirmations ne valent que jusqu'au chrono
  const owner = new Map(); // uid -> key (historique, puis appareil actuel prioritaire)
  for (const [key, p] of Object.entries(players)) for (const uid of Object.keys(p.uids ?? {})) owner.set(uid, key);
  for (const [key, p] of Object.entries(players)) if (p.uid) owner.set(p.uid, key);

  const rows = Object.entries(players).map(([key, p]) => {
    const devices = Object.keys(p.uids ?? {});
    const mine = (byUid) => {
      // Un élève qui a changé d'appareil : on garde sa réponse la plus ancienne (la seule comptée).
      const list = Object.entries(byUid ?? {}).filter(([uid]) => owner.get(uid) === key).map(([, a]) => a);
      return list.sort((a, b) => (a.t ?? 0) - (b.t ?? 0))[0] ?? null;
    };
    const cells = questions.map((_, q) => {
      const a = mine(answers[q]);
      if (!a) return null;
      const correct = correctOf(q, reveals, questions);
      const opened = openedAtOf(q, reveals, game);
      return {
        c: a.c,
        ok: correct === null ? null : a.c === correct,
        delay: opened ? Math.max(0, (a.t - opened) / 1000) : null,
      };
    });
    const answered = cells.filter(Boolean);
    return {
      key,
      name: p.name ?? key,
      free: p.free === true,
      online: present.has(p.uid),
      devices: devices.length,
      ready: askReady ? Boolean(acks[p.uid]) : null,
      current: curQ === null ? null : cells[curQ] ?? null,
      cells,
      score: answered.filter((c) => c.ok).length,
      answered: answered.length,
    };
  });

  const active = rows.filter((r) => !r.free);
  const online = active.filter((r) => r.online);
  const known = new Set(owner.keys());
  const orphans = [...present].filter((uid) => !known.has(uid) || players[owner.get(uid)]?.free === true).length;

  const alerts = [];
  const names = (list, max = 12) => {
    const sorted = list.map((r) => r.name).sort((a, b) => a.localeCompare(b, 'fr'));
    return sorted.length > max ? `${sorted.slice(0, max).join(', ')} et ${sorted.length - max} autres` : sorted.join(', ');
  };
  const offline = active.filter((r) => !r.online);
  if (offline.length && phase !== 'idle') alerts.push({ level: 'ko', text: `Hors ligne (${offline.length}) : ${names(offline)}` });
  if (phase === 'ready') {
    const late = online.filter((r) => !r.ready);
    if (late.length) alerts.push({ level: 'warn', text: `Pas encore prêts (${late.length}) : ${names(late)}` });
  }
  if (phase === 'question') {
    const silent = online.filter((r) => !r.current);
    if (silent.length && silent.length <= 10) alerts.push({ level: 'info', text: `Sans réponse (${silent.length}) : ${names(silent)}` });
    else if (silent.length) alerts.push({ level: 'info', text: `${silent.length} élèves n'ont pas encore répondu` });
  }
  if (orphans) alerts.push({ level: 'warn', text: `${orphans} téléphone${orphans > 1 ? 's' : ''} connecté${orphans > 1 ? 's' : ''} sans prénom (écran d'inscription)` });
  const switched = active.filter((r) => r.devices > 1);
  if (switched.length) alerts.push({ level: 'info', text: `Ont changé d'appareil : ${names(switched)}` });

  const current = curQ === null ? [] : active.map((r) => r.current).filter(Boolean); // une réponse envoyée compte, même si l'élève a décroché depuis
  const nChoices = curQ === null ? 0 : questions[curQ]?.choices.length ?? 0;
  const done = questions.map((_, q) => q).filter((q) => reveals?.[q]);
  const stats = {
    phase,
    enrolled: active.length,
    online: online.length,
    ready: askReady ? online.filter((r) => r.ready).length : null,
    answered: current.length,
    distribution: Array.from({ length: nChoices }, (_, i) => current.filter((a) => a.c === i).length),
    rightRate: current.length ? current.filter((a) => a.ok).length / current.length : null,
    // Réussite par question corrigée : repère les questions mal comprises.
    perQuestion: questions.map((_, q) => {
      const list = active.map((r) => r.cells[q]).filter(Boolean);
      return { answered: list.length, right: list.filter((c) => c.ok).length, revealed: done.includes(q) };
    }),
    orphans,
  };
  return { rows, alerts, stats };
}
