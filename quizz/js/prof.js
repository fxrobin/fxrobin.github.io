// Régie du prof : fichier de questions, pilotage des manches, suivi des élèves, notes.
// C'est la seule page qui fait avancer la partie. L'écran projeté (ecran.html) ne fait que la suivre.
import {
  auth, db, ref, onValue, update, get, set, serverTimestamp, runTransaction, signOut, serverNow,
} from './firebase.js';
import { parseQuiz } from './quiz-format.js';
import { computeScores, toCsv } from './scoring.js';
import { followUp } from './suivi-model.js';
import { $, el, pageUrl, teacherLogin } from './teacher.js';
import { CHOICES, mark, show } from './ui.js';

const MD_KEY = 'quizz.prof.md';
const PAGES = ['login', 'setup', 'dash'];
const PHASES = {
  idle: 'Pas de partie', lobby: 'Salle ouverte', ready: 'Préparation', question: 'Question ouverte',
  reveal: 'Correction', roundEnd: 'Fin de manche',
};
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* indisponible */ } },
};
const byName = (a, b) => a.name.localeCompare(b.name, 'fr');

let quiz = null; // { rounds, errors }
let game = null;
let players = {};
const state = { present: new Set(), answers: {}, reveals: {}, acks: {}, scores: {}, linked: false };
let closing = false;
let launching = false;
let view = 'auto'; // 'setup' quand le prof revient au fichier de questions en cours de partie
let sortMode = 'issues';
const offlineSince = new Map(); // key -> heure du décrochage (null : déjà absent à l'ouverture)
let firstRender = true;

const newSession = () => Math.random().toString(36).slice(2, 10);
const enrolled = () => Object.values(players).filter((p) => p.free !== true);
const connected = () => enrolled().filter((p) => state.present.has(p.uid));
const currentQuestion = () => quiz?.rounds[game.round - 1]?.questions[game.q];
const roundQuestions = () => quiz?.rounds[(game?.round ?? 0) - 1]?.questions ?? [];
const quizReady = () => quiz && quiz.errors.length === 0;

teacherLogin(PAGES, start);

// ---- Fichier de questions ------------------------------------------------------

function loadMarkdown(text, { persist = false } = {}) {
  quiz = parseQuiz(text);
  store.set(MD_KEY, text);
  // Un fichier valide déposé par le prof est gardé dans Firebase (lecture prof seulement) :
  // les 3 manches sont proposées d'office sur n'importe quel poste, et l'écran projeté le lit.
  if (persist && quiz.errors.length === 0) {
    set(ref(db, 'quiz'), { md: text, updatedAt: serverTimestamp() }).catch((e) => {
      $('file-label').textContent += ` (non enregistré en ligne : ${e.code || e.message})`;
    });
  }
  $('errors').replaceChildren(...quiz.errors.map((e) => el('li', { textContent: e })));
  const total = quiz.rounds.reduce((n, r) => n + r.questions.length, 0);
  $('file-label').textContent = quiz.errors.length
    ? 'Fichier refusé : corrige les erreurs ci-dessous puis recharge-le.'
    : `${quiz.rounds.length} manches, ${total} questions chargées. Dépose un autre fichier pour le remplacer.`;
  renderRounds();
  schedule();
}

$('file').addEventListener('change', async (ev) => {
  const f = ev.target.files[0];
  if (f) loadMarkdown(await f.text(), { persist: true });
});
const drop = $('drop');
drop.addEventListener('dragover', (ev) => { ev.preventDefault(); drop.classList.add('over'); });
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', async (ev) => {
  ev.preventDefault();
  drop.classList.remove('over');
  const f = ev.dataTransfer.files[0];
  if (f) loadMarkdown(await f.text(), { persist: true });
});

function renderRounds() {
  $('rounds').replaceChildren(...(quizReady() ? quiz.rounds : []).map((r, i) => el('button', {
    className: 'go', textContent: `Ouvrir la salle : ${r.title} (${r.questions.length} q)`,
    onclick: () => { view = 'auto'; openLobby(i + 1); },
  })));
}

// ---- Actions sur la partie -----------------------------------------------------

async function openLobby(round) {
  const r = quiz.rounds[round - 1];
  // Une manche déjà jouée garde ses réponses : on propose de les effacer pour repartir à zéro.
  if ((await get(ref(db, `answers/${round}`))).exists()
    && confirm(`La manche ${round} a déjà des réponses enregistrées (essai précédent ?). Les effacer avant de l'ouvrir ?\n\nOK : effacer les réponses de cette manche. Annuler : les garder.`)) {
    await update(ref(db), { [`answers/${round}`]: null, [`reveals/${round}`]: null, [`acks/${round}`]: null });
    await publishScores();
  }
  await set(ref(db, 'game'), {
    session: game?.session || newSession(), phase: 'lobby', round, title: r.title,
    q: 0, qCount: r.questions.length, nChoices: 0, openedAt: 0, duration: 0, correct: null, qr: false,
  });
}

/** Prépare la question : les téléphones affichent les boutons et confirment qu'ils sont prêts. */
async function startQuestion(q) {
  const question = quiz.rounds[game.round - 1].questions[q];
  closing = false;
  launching = false;
  await update(ref(db, 'game'), {
    phase: 'ready', q, nChoices: question.choices.length, duration: question.duration,
    openedAt: 0, correct: null, qr: false,
  });
}

/** Démarre le chrono, une seule fois, seulement depuis la phase « prêts ». */
async function goLive() {
  if (launching || game?.phase !== 'ready') return;
  launching = true;
  const { round, q } = game;
  try {
    await runTransaction(ref(db, 'game'), (g) => {
      if (!g || g.phase !== 'ready' || g.round !== round || g.q !== q) return undefined;
      // Heure de départ corrigée par l'écart avec le serveur (pas l'horloge brute du poste prof).
      return { ...g, phase: 'question', openedAt: Math.round(serverNow()) };
    });
  } finally {
    launching = false;
  }
}

async function closeQuestion() {
  if (closing || game?.phase !== 'question') return;
  closing = true;
  const { round, q, openedAt } = game;
  const correct = currentQuestion().correct;
  try {
    // La bonne réponse est enregistrée (lecture prof seulement) AVANT d'ouvrir la correction :
    // un rechargement entre les deux écritures ne peut plus faire perdre la question.
    await set(ref(db, `reveals/${round}/${q}`), { correct, openedAt });
    const res = await runTransaction(ref(db, 'game'), (g) => {
      if (!g || g.phase !== 'question' || g.round !== round || g.q !== q) return undefined;
      return { ...g, phase: 'reveal', correct };
    });
    if (res.committed) await publishScores();
  } catch (e) {
    $('action-msg').textContent = `Erreur à la fermeture (${e.code || e.message}) : recommence.`;
  } finally {
    closing = false;
  }
}

/** Reprise : une correction affichée doit toujours avoir sa bonne réponse enregistrée. */
async function ensureReveal(g) {
  if (g?.phase !== 'reveal' || g.correct === null || g.correct === undefined) return;
  const r = ref(db, `reveals/${g.round}/${g.q}`);
  if (!(await get(r)).exists()) {
    await set(r, { correct: g.correct, openedAt: g.openedAt });
    await publishScores();
  }
}

/** Recalcule les notes et les publie (l'écran projeté lit le classement dans /scores). */
async function publishScores() {
  const [p, a, rv] = await Promise.all(['players', 'answers', 'reveals'].map((k) => get(ref(db, k))));
  const rows = computeScores({ players: p.val(), answers: a.val(), reveals: rv.val() });
  const scores = {};
  for (const r of rows) scores[r.key] = { name: r.name, r1: r.r1, r2: r.r2, r3: r.r3, total: r.total, rank: r.rank };
  await set(ref(db, 'scores'), scores);
  return rows;
}

async function next() {
  if (game.q + 1 < game.qCount) return startQuestion(game.q + 1);
  await publishScores();
  await update(ref(db, 'game'), { phase: 'roundEnd', correct: null });
}

async function resetAll() {
  if (!confirm('Effacer la partie, les élèves, les réponses et les notes ?')) return;
  await update(ref(db), {
    game: { phase: 'idle', session: newSession() }, players: null, presence: null, acks: null, answers: null, reveals: null, scores: null,
  });
}

const toggleQr = () => update(ref(db, 'game'), { qr: !game?.qr });
const openScreen = () => window.open(pageUrl('ecran.html'), 'quizz-ecran', 'popup,width=1280,height=720');

/** Bouton principal : l'étape suivante de la partie, selon la phase. */
function primary() {
  const phase = game?.phase;
  if (phase === 'lobby') return { label: 'Lancer la question 1', run: () => startQuestion(0), hint: 'Les téléphones affichent les boutons' };
  if (phase === 'ready') {
    const waiting = connected().filter((p) => !state.acks[p.uid]).length;
    return waiting
      ? { label: 'Lancer sans attendre', run: goLive, hint: `${waiting} téléphone${waiting > 1 ? 's' : ''} pas encore prêt${waiting > 1 ? 's' : ''}` }
      : { label: 'Lancer le chrono', run: goLive, hint: 'Départ automatique : tous prêts' };
  }
  if (phase === 'question') return { label: 'Fermer la question', run: closeQuestion, hint: 'Fermeture automatique au chrono ou quand tous ont répondu' };
  if (phase === 'reveal') {
    const last = game.q + 1 >= game.qCount;
    return { label: last ? 'Fin de la manche' : `Question suivante (${game.q + 2}/${game.qCount})`, run: next, hint: last ? "Affiche le classement à l'écran" : 'Passe en préparation' };
  }
  if (phase === 'roundEnd') {
    const nextRound = game.round < (quiz?.rounds.length ?? 0) ? game.round + 1 : null;
    return nextRound
      ? { label: `Ouvrir la manche ${nextRound}`, run: () => openLobby(nextRound), hint: 'Affiche la salle et le QR code' }
      : { label: 'Voir les notes', run: openNotes, hint: 'Fin du quiz' };
  }
  return null;
}

/** Enchaînements automatiques : départ quand tous sont prêts, fermeture au chrono. */
function automate() {
  if (game?.phase === 'ready') {
    const list = connected();
    if (list.length > 0 && list.every((p) => state.acks[p.uid])) setTimeout(goLive, 300);
  }
  if (game?.phase === 'question' && game.openedAt) {
    const current = new Set(connected().map((p) => p.uid));
    const n = Object.keys(state.answers[game.q] ?? {}).filter((uid) => current.has(uid)).length;
    // Fermeture au chrono avec la même marge que les règles (1,5 s) : une réponse touchée
    // à la dernière seconde sur un réseau chargé arrive encore à temps.
    const expired = serverNow() - game.openedAt >= game.duration * 1000 + 1500;
    if (expired || (current.size > 0 && n >= current.size)) setTimeout(closeQuestion, 0);
  }
}

// Le bouton change de rôle (Lancer -> Fermer -> Suivante) : un double-clic ou un double appui
// ne doit pas déclencher l'action suivante. Bouton inerte un court instant après chaque changement.
let lastLabel = '';
function renderAction() {
  const p = primary();
  const btn = $('action');
  btn.hidden = !p;
  $('action-hint').textContent = p?.hint ?? '';
  if (!p) return;
  if (p.label !== lastLabel) {
    lastLabel = p.label;
    btn.textContent = p.label;
    btn.disabled = true;
    $('action-msg').textContent = '';
    setTimeout(() => { btn.disabled = false; }, 900);
  }
  btn.onclick = () => { if (!btn.disabled) p.run(); };
}

document.addEventListener('keydown', (e) => {
  if (e.repeat || (e.key !== ' ' && e.key !== 'Enter')) return;
  // Sur un bouton ou un champ, le navigateur gère déjà la touche : pas de double déclenchement.
  if (e.target.closest('button, input, textarea, select, a, label')) return;
  if ($('dash').hidden || !$('notes').hidden) return;
  e.preventDefault();
  $('action').click();
});

// ---- Notes -----------------------------------------------------------------------

async function openNotes() {
  const rows = await publishScores();
  const body = $('notes-body');
  body.replaceChildren(...rows.map((r) => {
    const p = players[r.key];
    const free = p?.free === true;
    const btn = el('button', {
      className: 'go secondary', textContent: free ? 'Libéré' : 'Libérer', disabled: free,
      onclick: async () => {
        if (!confirm(`Libérer « ${r.name} » ? L'élève pourra reprendre ce prénom depuis un autre appareil.`)) return;
        await set(ref(db, `players/${r.key}/free`), true);
        openNotes();
      },
    });
    // Retire l'élève de la partie : son téléphone revient à l'écran d'arrivée. S'il se réinscrit
    // depuis le même téléphone, ses réponses (rattachées à son appareil) comptent de nouveau.
    const kick = el('button', {
      className: 'go secondary', textContent: 'Déconnecter',
      onclick: async () => {
        if (!confirm(`Déconnecter « ${r.name} » ? Il disparaît de la partie et des notes jusqu'à ce qu'il se réinscrive.`)) return;
        await set(ref(db, `players/${r.key}`), null);
        openNotes();
      },
    });
    return el('tr', {},
      el('td', { textContent: r.rank }), el('td', { textContent: r.name }),
      el('td', { textContent: r.r1 }), el('td', { textContent: r.r2 }), el('td', { textContent: r.r3 }),
      el('td', {}, el('strong', { textContent: r.total })), el('td', { style: 'display:flex;gap:.4rem' }, btn, kick));
  }));
  $('notes').hidden = false;
}
$('notes-close').addEventListener('click', () => { $('notes').hidden = true; });
$('csv-btn').addEventListener('click', async () => {
  const rows = await publishScores();
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
  el('a', { href: url, download: 'notes-quizz-insa.csv' }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/** Barre d'outils reconstruite seulement si elle change : un clic n'est jamais perdu pendant le chrono. */
const toolsKey = new Map();
function renderTools(id, inSetup) {
  const key = `${inSetup}|${Boolean(game?.qr)}|${game && game.phase !== 'idle'}|${quizReady()}`;
  if (toolsKey.get(id) === key) return;
  toolsKey.set(id, key);
  $(id).replaceChildren(...toolButtons({ inSetup }));
}

function toolButtons({ inSetup }) {
  const active = game && game.phase !== 'idle';
  return [
    el('button', { className: 'go secondary', textContent: 'Écran projeté', title: 'Ouvre la fenêtre à placer sur le vidéoprojecteur', onclick: openScreen }),
    el('button', { className: `go secondary${game?.qr ? ' on' : ''}`, textContent: game?.qr ? 'Masquer le QR' : 'QR à l\'écran', onclick: toggleQr }),
    el('button', { className: 'go secondary', textContent: 'Notes', onclick: openNotes }),
    inSetup
      ? (active && quizReady() ? el('button', { className: 'go secondary', textContent: 'Retour à la régie', onclick: () => { view = 'auto'; schedule(); } }) : '')
      : el('button', { className: 'go secondary', textContent: 'Questions', onclick: () => { view = 'setup'; schedule(); } }),
    el('button', { className: 'go secondary', textContent: 'Réinitialiser', onclick: resetAll }),
    el('button', { className: 'go secondary', textContent: 'Se déconnecter', onclick: () => signOut(auth).then(() => location.reload()) }),
  ];
}

// ---- Abonnements -----------------------------------------------------------------

const subs = new Map(); // nom -> {path, off}
/** (Ré)abonne un flux quand son chemin change (nouvelle manche, nouvelle question). */
function watch(name, path, apply) {
  const cur = subs.get(name);
  if (cur?.path === path) return;
  cur?.off();
  apply(null);
  subs.set(name, { path, off: path ? onValue(ref(db, path), (s) => { apply(s.val()); schedule(); }) : () => {} });
}

function follow() {
  const round = game && game.phase !== 'idle' ? game.round : null;
  watch('answers', round ? `answers/${round}` : null, (v) => { state.answers = v || {}; });
  watch('reveals', round ? `reveals/${round}` : null, (v) => { state.reveals = v || {}; });
  const live = game && (game.phase === 'ready' || game.phase === 'question');
  watch('acks', live ? `acks/${game.round}/${game.q}` : null, (v) => { state.acks = v || {}; });
}

let started = false;
function start() {
  if (started) return schedule();
  started = true;
  const saved = store.get(MD_KEY);
  if (saved) loadMarkdown(saved);
  // Questions enregistrées en ligne : elles priment sur la copie locale (autre poste, autre navigateur).
  get(ref(db, 'quiz/md')).then((s) => {
    if (s.exists() && s.val() !== store.get(MD_KEY)) loadMarkdown(s.val());
  }).catch(() => { /* hors ligne : on garde la copie locale */ });
  onValue(ref(db, '.info/connected'), (s) => { state.linked = s.val() === true; schedule(); });
  onValue(ref(db, 'players'), (s) => { players = s.val() || {}; schedule(); });
  onValue(ref(db, 'presence'), (s) => { state.present = new Set(Object.keys(s.val() || {})); schedule(); });
  onValue(ref(db, 'scores'), (s) => { state.scores = s.val() || {}; schedule(); });
  onValue(ref(db, 'game'), (s) => {
    game = s.val();
    follow();
    ensureReveal(game).catch(() => {});
    schedule();
  });
  setInterval(() => {
    tickClock();
    automate();
    // Pendant le chrono, compteurs et tableau se rafraîchissent même sans nouvelle donnée.
    if (game?.phase === 'question' || [...offlineSince.values()].some(Boolean)) schedule();
  }, 500);
}

let pending = false;
function schedule() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => { pending = false; render(); });
}

// ---- Affichage -------------------------------------------------------------------

function remaining() {
  if (game?.phase !== 'question' || !game.openedAt) return '';
  return Math.min(game.duration, Math.max(0, Math.ceil(game.duration - (serverNow() - game.openedAt) / 1000)));
}

function tickClock() {
  if (!started) return;
  $('chrono').textContent = remaining();
  $('clock').textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function ago(t) {
  const s = Math.round((Date.now() - t) / 1000);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min`;
}

function kpi(value, label, { alert = false, ratio = null } = {}) {
  return el('div', { className: `kpi${alert ? ' alert' : ''}` },
    el('div', { className: 'v', textContent: value }),
    el('div', { className: 'l', textContent: label }),
    ratio === null ? '' : el('div', { className: 'bar2' }, el('i', { style: `width:${Math.round(ratio * 100)}%` })));
}

/** Case du tableau : pastille de la couleur choisie ; fond vert si juste, rouge si faux. */
function cell(c, { showDelay = false } = {}) {
  if (!c) return { cls: '', node: el('span', { className: 'nil', textContent: '·' }) };
  const chip = el('span', { className: `chip ${CHOICES[c.c].cls}`, textContent: CHOICES[c.c].letter });
  const node = el('span', { className: 'cell' }, chip);
  if (c.delay !== null) {
    node.title = `${CHOICES[c.c].letter} en ${c.delay.toFixed(1)} s`;
    if (showDelay) node.append(el('small', { textContent: `${c.delay.toFixed(1)} s` }));
  }
  return { cls: c.ok === true ? 'ok' : c.ok === false ? 'ko' : '', node };
}

function issueWeight(r, phase) {
  if (r.free) return 9;
  if (!r.online) return 0;
  if (phase === 'ready' && !r.ready) return 1;
  if (phase === 'question' && !r.current) return 2;
  return 5;
}

function render() {
  if (!auth.currentUser || auth.currentUser.isAnonymous) return;
  const phase = game?.phase ?? 'idle';
  const round = quiz?.rounds[(game?.round ?? 0) - 1];
  if (view === 'setup' || !quizReady() || phase === 'idle' || !round) {
    renderTools('tools-setup', true);
    return show(PAGES, 'setup');
  }
  show(PAGES, 'dash');
  renderTools('tools-dash', false);

  const questions = roundQuestions();
  const { rows, alerts, stats } = followUp({
    players, present: state.present, answers: state.answers, reveals: state.reveals,
    acks: state.acks, game, questions,
  });

  for (const r of rows) {
    if (r.online || r.free) offlineSince.delete(r.key);
    else if (!offlineSince.has(r.key)) offlineSince.set(r.key, firstRender ? null : Date.now());
  }
  if (rows.length) firstRender = false; // attend le premier chargement des élèves

  // En-tête
  $('where').textContent = `${round.title}${['ready', 'question', 'reveal'].includes(phase) ? ` · Q${game.q + 1}/${game.qCount}` : ''}`;
  const pill = $('phase');
  pill.textContent = PHASES[phase] ?? phase;
  pill.className = `pill${phase === 'question' ? ' live' : phase === 'ready' ? ' warn' : ''}`;
  $('link-dot').className = `dot ${state.linked ? 'on' : 'off'}`;
  $('link-txt').textContent = state.linked ? 'Liaison Firebase OK' : 'Liaison Firebase coupée';
  tickClock();

  // Indicateurs
  const live = stats.distribution.length > 0; // une question est affichée (préparation, chrono ou correction)
  const offline = stats.enrolled - stats.online;
  $('kpis').replaceChildren(
    kpi(stats.enrolled, 'inscrits'),
    kpi(stats.online, offline ? `en ligne · ${offline} hors ligne` : 'en ligne', { alert: offline > 0, ratio: stats.enrolled ? stats.online / stats.enrolled : null }),
    kpi(stats.ready ?? '–', 'téléphones prêts', { ratio: stats.ready === null || !stats.online ? null : stats.ready / stats.online }),
    kpi(live ? stats.answered : '–', 'réponses reçues', { ratio: live && stats.enrolled ? stats.answered / stats.enrolled : null }),
    kpi(stats.rightRate === null ? '–' : `${Math.round(stats.rightRate * 100)} %`, 'bonnes réponses (direct)'),
    kpi(stats.orphans, 'téléphones sans prénom', { alert: stats.orphans > 0 }),
  );

  renderAction();
  renderQuestion(questions, stats);
  renderPerQuestion(stats);
  $('alerts').replaceChildren(...(alerts.length
    ? alerts.map((a) => el('div', { className: a.level, textContent: a.text }))
    : [el('div', { className: 'none', textContent: 'Rien à signaler.' })]));
  renderTable(rows, questions, phase);
}

function renderQuestion(questions, stats) {
  const live = ['ready', 'question', 'reveal'].includes(game.phase);
  const q = live ? questions[game.q] : null;
  if (game.phase === 'roundEnd') {
    const top = Object.values(state.scores).sort((a, b) => a.rank - b.rank || byName(a, b)).slice(0, 8);
    $('qcard').replaceChildren(el('h2', { textContent: 'Classement projeté' }),
      el('table', { className: 'board-mini' }, ...top.map((r) => el('tr', {},
        el('td', { textContent: r.rank }), el('td', { textContent: r.name }), el('td', { textContent: `total ${r.total}` })))));
    return;
  }
  if (!q) {
    const first = game.phase === 'lobby' ? questions[0] : null;
    $('qcard').replaceChildren(el('h2', { textContent: 'Question' }),
      el('p', { className: 'nextq', textContent: first ? `Première question : ${first.text}` : 'Pas de question en cours.' }));
    return;
  }
  const total = Math.max(1, stats.answered);
  const choices = q.choices.map((text, i) => {
    const n = stats.distribution[i] ?? 0;
    return el('div', { className: `choice${i === q.correct ? ' right' : ''}` },
      mark(i, { solo: true }),
      el('span', { className: 't', textContent: `${i === q.correct ? '✓ ' : ''}${text}` }),
      el('span', { className: 'n', textContent: n }),
      el('span', { className: 'gauge' }, el('i', { style: `width:${(n / total) * 100}%;background:${CHOICES[i].color}` })));
  });
  const following = questions[game.q + 1];
  $('qcard').replaceChildren(
    el('h2', { textContent: `Question ${game.q + 1} · ${q.duration} s` }),
    el('p', { className: 'qtext', textContent: q.text }),
    ...choices,
    q.explanation ? el('div', { className: 'say', textContent: `À dire : ${q.explanation}` }) : '',
    el('p', { className: 'nextq', textContent: following ? `Ensuite : ${following.text}` : 'Dernière question de la manche.' }),
  );
}

function renderPerQuestion(stats) {
  $('perq').replaceChildren(...stats.perQuestion.map((p, i) => {
    const pct = p.answered ? Math.round((p.right / p.answered) * 100) : null;
    const cls = [pct !== null && pct < 50 && p.revealed ? 'low' : '', game.q === i && game.phase !== 'lobby' ? 'cur' : ''].join(' ');
    return el('div', { className: cls, title: `${p.right} / ${p.answered} bonnes réponses` },
      el('b', { textContent: pct === null ? '–' : `${pct}%` }), `Q${i + 1}`);
  }));
}

function renderTable(rows, questions, phase) {
  const curQ = ['ready', 'question', 'reveal'].includes(phase) ? game.q : null;
  const showReady = phase === 'ready' || phase === 'question';
  $('thead').replaceChildren(el('tr', {},
    el('th', { textContent: 'Élève', style: 'text-align:left' }),
    showReady ? el('th', { textContent: 'Prêt' }) : '',
    ...questions.map((_, i) => el('th', { className: i === curQ ? 'cur' : '', textContent: `Q${i + 1}` })),
    el('th', { textContent: 'Manche' }),
    el('th', { textContent: 'Total' })));

  const sorters = {
    name: byName,
    score: (a, b) => b.score - a.score || byName(a, b),
    issues: (a, b) => issueWeight(a, phase) - issueWeight(b, phase) || byName(a, b),
  };
  $('tbody').replaceChildren(...[...rows].sort(sorters[sortMode]).map((r) => {
    const since = offlineSince.get(r.key);
    const status = r.free ? 'Libéré' : r.online ? '' : `hors ligne${since ? ` · ${ago(since)}` : ''}`;
    const dot = r.free ? '' : !r.online ? 'off' : showReady && !r.ready ? 'wait' : 'on';
    return el('tr', { className: r.free ? 'free' : r.online ? '' : 'offline' },
      el('td', { className: 'name' }, el('span', { className: `dot ${dot}` }), r.name,
        r.devices > 1 ? el('small', { textContent: `${r.devices} appareils` }) : '',
        status ? el('small', { textContent: status }) : ''),
      showReady ? el('td', {}, el('span', { className: r.ready ? 'yes' : 'no', textContent: r.ready ? '✓' : '✗' })) : '',
      ...r.cells.map((c, i) => {
        const { cls, node } = cell(c, { showDelay: i === curQ });
        return el('td', { className: [cls, i === curQ ? 'cur' : ''].join(' ').trim() }, node);
      }),
      el('td', { className: 'score', textContent: `${r.score} / ${questions.length}` }),
      el('td', { className: 'score', textContent: state.scores[r.key]?.total ?? '–' }));
  }));
}

for (const b of document.querySelectorAll('[data-sort]')) {
  b.addEventListener('click', () => {
    sortMode = b.dataset.sort;
    for (const o of document.querySelectorAll('[data-sort]')) o.classList.toggle('on', o === b);
    schedule();
  });
}
