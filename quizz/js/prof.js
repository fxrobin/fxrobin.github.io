// Page prof : fichier de questions, pilotage des manches, correction, classement, notes.
import {
  auth, db, ref, onValue, update, get, set, serverTimestamp, runTransaction,
  GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, serverNow, useEmulators,
} from './firebase.js';
import { parseQuiz } from './quiz-format.js';
import { computeScores, toCsv } from './scoring.js';
import { CHOICES, show } from './ui.js';

const TEACHER = 'fxrobin@gmail.com';
const MD_KEY = 'quizz.prof.md';
const PAGES = ['login', 'setup', 'stage'];
const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...children) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...children);
  return n;
};
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* indisponible */ } },
};

let quiz = null; // { rounds, errors }
let game = null;
let players = {};
let present = new Set(); // uid des téléphones réellement connectés
let answers = {}; // réponses de la question en cours : {uid: {c, t}}
let unsubAnswers = null;
let watchedQ = null;
let tick = null;
let closing = false;
let lastBoard = [];

const studentUrl = () => new URL(`./${useEmulators() ? '?emu=1' : ''}`, location.href).href;
const newSession = () => Math.random().toString(36).slice(2, 10);
const enrolled = () => Object.values(players).filter((p) => p.free !== true);
const connected = () => enrolled().filter((p) => present.has(p.uid));
const activePlayers = () => connected().length;
const currentQuestion = () => quiz?.rounds[game.round - 1]?.questions[game.q];

// ---- Connexion ---------------------------------------------------------------

$('login-btn').addEventListener('click', () => signInWithPopup(auth, new GoogleAuthProvider()).catch((e) => {
  $('login-msg').textContent = `Connexion impossible : ${e.code || e.message}`;
}));

onAuthStateChanged(auth, (user) => {
  if (!user || user.isAnonymous) {
    $('login-msg').textContent = '';
    return show(PAGES, 'login');
  }
  if (user.email !== TEACHER || !user.emailVerified) {
    $('login-msg').textContent = `Accès réservé à l'enseignant (connecté en tant que ${user.email}).`;
    signOut(auth);
    return show(PAGES, 'login');
  }
  start();
});

// ---- Fichier de questions ------------------------------------------------------

function loadMarkdown(text, { persist = false } = {}) {
  quiz = parseQuiz(text);
  store.set(MD_KEY, text);
  // Un fichier valide déposé par le prof est gardé dans Firebase (lecture prof seulement) :
  // les 3 manches sont proposées d'office sur n'importe quel poste après connexion.
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
  render();
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
  const ok = quiz && quiz.errors.length === 0;
  $('rounds').replaceChildren(...(ok ? quiz.rounds : []).map((r, i) => el('button', {
    className: 'go', textContent: `Ouvrir la salle : ${r.title} (${r.questions.length} q)`,
    onclick: () => openLobby(i + 1),
  })));
}

// ---- Actions sur la partie -----------------------------------------------------

async function openLobby(round) {
  const r = quiz.rounds[round - 1];
  await set(ref(db, 'game'), {
    session: game?.session || newSession(), phase: 'lobby', round, title: r.title,
    q: 0, qCount: r.questions.length, nChoices: 0, openedAt: 0, duration: 0, correct: null,
  });
}

async function startQuestion(q) {
  const question = quiz.rounds[game.round - 1].questions[q];
  closing = false;
  await update(ref(db, 'game'), {
    phase: 'question', q, nChoices: question.choices.length, duration: question.duration,
    openedAt: serverTimestamp(), correct: null,
  });
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
    $('stage-info').textContent = `Erreur à la fermeture (${e.code || e.message}) : clique de nouveau sur « Fermer la question ».`;
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

async function publishScores() {
  const [p, a, rv] = await Promise.all(['players', 'answers', 'reveals'].map((k) => get(ref(db, k))));
  const rows = computeScores({ players: p.val(), answers: a.val(), reveals: rv.val() });
  lastBoard = rows;
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
    game: { phase: 'idle', session: newSession() }, players: null, presence: null, answers: null, reveals: null, scores: null,
  });
  lastBoard = [];
}

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

function qrSvg() {
  const qr = qrcode(0, 'M');
  qr.addData(studentUrl());
  qr.make();
  const box = el('div', { className: 'qr' });
  box.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
  return box;
}

function showQr() {
  $('qr-full-code').replaceChildren(qrSvg());
  $('qr-full-url').textContent = studentUrl().replace(/^https?:\/\//, '');
  $('qr-full').hidden = false;
}
$('qr-full').addEventListener('click', () => { $('qr-full').hidden = true; });

function toolButtons() {
  return [
    el('button', { className: 'go secondary', textContent: 'QR code', onclick: showQr }),
    el('button', { className: 'go secondary', textContent: 'Notes', onclick: openNotes }),
    el('button', { className: 'go secondary', textContent: 'Questions', onclick: () => show(PAGES, 'setup') }),
    el('button', { className: 'go secondary', textContent: 'Réinitialiser', onclick: resetAll }),
    el('button', { className: 'go secondary', textContent: 'Se déconnecter', onclick: () => signOut(auth).then(() => location.reload()) }),
  ];
}

// ---- Affichage -------------------------------------------------------------------

function watchAnswers() {
  const key = game && (game.phase === 'question' || game.phase === 'reveal') ? `${game.round}/${game.q}` : null;
  if (key === watchedQ) return;
  unsubAnswers?.();
  unsubAnswers = null;
  answers = {};
  watchedQ = key;
  if (key) unsubAnswers = onValue(ref(db, `answers/${key}`), (s) => { answers = s.val() || {}; render(); });
}

function remaining() {
  return Math.min(game.duration, Math.max(0, Math.ceil(game.duration - (serverNow() - game.openedAt) / 1000)));
}

function choiceBox(i, text, extraClass = '', count = null) {
  const ch = CHOICES[i];
  const box = el('div', { className: `${ch.cls} ${extraClass}` },
    el('span', { className: 'tag', textContent: `${ch.shape} ${ch.letter}` }),
    el('span', { textContent: text }));
  if (count !== null) box.append(el('span', { className: 'count', textContent: count }));
  return box;
}

function stage(kicker, body, info, actionLabel, action) {
  $('stage-kicker').textContent = kicker;
  $('stage-body').replaceChildren(...body);
  $('stage-info').textContent = info;
  const btn = $('stage-action');
  btn.hidden = !actionLabel;
  if (btn.textContent !== (actionLabel || '')) {
    // Le bouton change de rôle (Lancer -> Fermer -> Suivante) : un double-clic ne doit pas
    // déclencher l'action suivante. Bouton inerte un court instant après chaque changement.
    btn.disabled = true;
    setTimeout(() => { btn.disabled = false; }, 900);
  }
  btn.textContent = actionLabel || '';
  btn.onclick = action || null;
  $('tools-stage').replaceChildren(...toolButtons());
  show(PAGES, 'stage');
}

function render() {
  clearInterval(tick);
  watchAnswers();
  if (!auth.currentUser || auth.currentUser.isAnonymous) return;
  const ready = quiz && quiz.errors.length === 0;
  if (!game || game.phase === 'idle' || !ready) {
    $('tools-setup').replaceChildren(...toolButtons().filter((b) => b.textContent !== 'Questions'));
    return show(PAGES, 'setup');
  }
  const round = quiz.rounds[game.round - 1];
  if (!round) return show(PAGES, 'setup');
  const names = connected().map((p) => p.name).sort((a, b) => a.localeCompare(b, 'fr'));
  const enrolledCount = enrolled().length;

  if (game.phase === 'lobby') {
    const qrBox = qrSvg();
    return stage(`Manche ${game.round}`, [
      el('h1', { className: 'title h-round', textContent: round.title.replace(/^Manche \d+ · |^Finale · /, '') }),
      el('div', { className: 'lobby' }, qrBox, el('div', {},
        el('div', { className: 'muted', textContent: studentUrl().replace(/^https?:\/\//, '') }),
        el('div', { className: 'count-big', textContent: names.length }),
        el('div', { className: 'muted', textContent: `${names.length > 1 ? 'connectés' : 'connecté'} · ${enrolledCount} inscrit${enrolledCount > 1 ? 's' : ''}` }),
        el('p', { className: 'names', textContent: names.join(' · ') }))),
    ], `${round.questions.length} questions`, 'Lancer', () => startQuestion(0));
  }

  const q = currentQuestion();
  if (game.phase === 'question') {
    const shown = `${game.round}/${game.q}`;
    const draw = () => {
      // Le minuteur d'une question déjà fermée ne doit jamais réécrire l'écran.
      if (game?.phase !== 'question' || `${game.round}/${game.q}` !== shown) { clearInterval(tick); return; }
      const current = new Set(connected().map((p) => p.uid));
      const n = Object.keys(answers).filter((uid) => current.has(uid)).length;
      const total = activePlayers();
      const s = remaining();
      // Fermeture au chrono avec la même marge que les règles (1,5 s) : une réponse touchée
      // à la dernière seconde sur un réseau chargé arrive encore à temps.
      const expired = serverNow() - game.openedAt >= game.duration * 1000 + 1500;
      stage(`Question ${game.q + 1} / ${game.qCount}`, [
        el('div', { className: 'bar' }, el('h1', { className: 'title q-text', textContent: q.text }), el('div', { className: 'clock', textContent: s })),
        el('div', { className: 'grid4' }, ...q.choices.map((c, i) => choiceBox(i, c))),
      ], `${n} / ${total} réponses`, 'Fermer la question', closeQuestion);
      if (expired || (total > 0 && n >= total)) setTimeout(closeQuestion, 0);
    };
    tick = setInterval(draw, 500);
    draw();
    return;
  }

  if (game.phase === 'reveal') {
    const counts = q.choices.map((_, i) => Object.values(answers).filter((a) => a.c === i).length);
    const last = game.q + 1 >= game.qCount;
    return stage(`Question ${game.q + 1} / ${game.qCount} · correction`, [
      el('h1', { className: 'title q-text', textContent: q.text }),
      el('div', { className: 'grid4' }, ...q.choices.map((c, i) => choiceBox(i, `${i === game.correct ? '✓ ' : ''}${c}`, i === game.correct ? 'right' : 'dim', counts[i]))),
      q.explanation ? el('div', { className: 'explain', textContent: q.explanation }) : '',
    ], `${Object.keys(answers).length} réponses`, last ? 'Fin de la manche' : 'Question suivante', next);
  }

  if (game.phase === 'roundEnd') {
    const top = lastBoard.slice(0, 10);
    const nextRound = game.round < quiz.rounds.length ? game.round + 1 : null;
    return stage(`Fin de la manche ${game.round}`, [
      el('h1', { className: 'title h-round', textContent: 'Classement' }),
      el('table', { className: 'board' }, ...top.map((r) => el('tr', {},
        el('td', { className: 'rank', textContent: r.rank }), el('td', { textContent: r.name }),
        el('td', { textContent: `${r[`r${game.round}`]} / ${game.qCount}` }), el('td', { textContent: `total ${r.total}` })))),
    ], 'Classement par total, puis par rapidité à égalité (sans effet sur la note).',
    nextRound ? `Ouvrir la manche ${nextRound}` : 'Voir les notes', nextRound ? () => openLobby(nextRound) : openNotes);
  }
  show(PAGES, 'setup');
}

// ---- Démarrage -------------------------------------------------------------------

let started = false;
function start() {
  if (started) return render();
  started = true;
  const saved = store.get(MD_KEY);
  if (saved) loadMarkdown(saved);
  // Questions enregistrées en ligne : elles priment sur la copie locale (autre poste, autre navigateur).
  get(ref(db, 'quiz/md')).then((s) => {
    if (s.exists() && s.val() !== store.get(MD_KEY)) loadMarkdown(s.val());
  }).catch(() => { /* hors ligne : on garde la copie locale */ });
  onValue(ref(db, 'players'), (s) => { players = s.val() || {}; render(); });
  onValue(ref(db, 'presence'), (s) => { present = new Set(Object.keys(s.val() || {})); render(); });
  onValue(ref(db, 'game'), async (s) => {
    game = s.val();
    ensureReveal(game).catch(() => {});
    if (game?.phase === 'roundEnd' && lastBoard.length === 0) {
      const rows = await publishScores().catch(() => []);
      lastBoard = rows;
    }
    render();
  });
}
