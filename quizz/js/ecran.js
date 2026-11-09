// Écran projeté aux élèves : suit la partie pilotée depuis la régie (prof.html).
// Lecture seule : cette page n'écrit jamais dans la base, elle ne peut pas perturber la partie.
import { db, ref, onValue, serverNow } from './firebase.js';
import { parseQuiz } from './quiz-format.js';
import { $, el, qrSvg, studentUrl, teacherLogin } from './teacher.js';
import { CHOICES, mark, show } from './ui.js';

const PAGES = ['login', 'stage'];
const state = { game: null, quiz: null, players: {}, present: new Set(), answers: {}, scores: {} };
let tick = null;
let unsubAnswers = null;
let watched = null;

teacherLogin(PAGES, start);

let started = false;
function start() {
  if (started) return render();
  started = true;
  onValue(ref(db, 'game'), (s) => { state.game = s.val(); watchAnswers(); render(); });
  onValue(ref(db, 'quiz/md'), (s) => { state.quiz = s.exists() ? parseQuiz(s.val()) : null; render(); });
  onValue(ref(db, 'players'), (s) => { state.players = s.val() || {}; render(); });
  onValue(ref(db, 'presence'), (s) => { state.present = new Set(Object.keys(s.val() || {})); render(); });
  onValue(ref(db, 'scores'), (s) => { state.scores = s.val() || {}; render(); });
}

function watchAnswers() {
  const g = state.game;
  const key = g && (g.phase === 'question' || g.phase === 'reveal') ? `${g.round}/${g.q}` : null;
  if (key === watched) return;
  unsubAnswers?.();
  unsubAnswers = null;
  state.answers = {};
  watched = key;
  if (key) unsubAnswers = onValue(ref(db, `answers/${key}`), (s) => { state.answers = s.val() || {}; render(); });
}

const connected = () => Object.values(state.players).filter((p) => p.free !== true && state.present.has(p.uid));

function remaining() {
  const g = state.game;
  return Math.min(g.duration, Math.max(0, Math.ceil(g.duration - (serverNow() - g.openedAt) / 1000)));
}

function choiceBox(i, text, extraClass = '', count = null) {
  const box = el('div', { className: `${CHOICES[i].cls} ${extraClass}` }, mark(i), el('span', { textContent: text }));
  if (count !== null) box.append(el('span', { className: 'count', textContent: count }));
  return box;
}

function stage(kicker, body, info = '') {
  $('stage-kicker').textContent = kicker;
  $('stage-body').replaceChildren(...body);
  $('stage-info').textContent = info;
  show(PAGES, 'stage');
}

function renderQrOverlay(on) {
  const box = $('qr-full');
  if (on && box.hidden) {
    $('qr-full-code').replaceChildren(qrSvg());
    $('qr-full-url').textContent = studentUrl().replace(/^https?:\/\//, '');
  }
  box.hidden = !on;
}

function render() {
  clearInterval(tick);
  const g = state.game;
  renderQrOverlay(Boolean(g?.qr));
  const round = state.quiz?.rounds[(g?.round ?? 0) - 1];
  if (!g || g.phase === 'idle' || !round) {
    return stage('Quiz INSA 2026', [el('div', { className: 'idle' },
      el('h1', { className: 'title', textContent: 'À quoi servez-vous encore ?' }),
      el('div', { className: 'muted', style: 'font-size:clamp(1.2rem,2vw,2.6rem)', textContent: 'Le quiz va commencer.' }))]);
  }

  if (g.phase === 'lobby') {
    const names = connected().map((p) => p.name).sort((a, b) => a.localeCompare(b, 'fr'));
    return stage(`Manche ${g.round}`, [
      el('h1', { className: 'title h-round', textContent: round.title.replace(/^Manche \d+ · |^Finale · /, '') }),
      el('div', { className: 'lobby' }, qrSvg(), el('div', {},
        el('div', { className: 'muted', textContent: studentUrl().replace(/^https?:\/\//, '') }),
        el('div', { className: 'count-big', textContent: names.length }),
        el('div', { className: 'muted', textContent: names.length > 1 ? 'connectés' : 'connecté' }),
        el('p', { className: 'names', textContent: names.join(' · ') }))),
    ], `${round.questions.length} questions`);
  }

  const q = round.questions[g.q];
  if (!q && g.phase !== 'roundEnd') return stage('Quiz INSA 2026', []);

  if (g.phase === 'ready') {
    return stage(`Question ${g.q + 1} / ${g.qCount} · préparez-vous`, [
      el('h1', { className: 'title q-text', textContent: q.text }),
      el('div', { className: 'grid4' }, ...q.choices.map((c, i) => choiceBox(i, c))),
    ]);
  }

  if (g.phase === 'question') {
    const shown = `${g.round}/${g.q}`;
    const draw = () => {
      if (state.game?.phase !== 'question' || `${state.game.round}/${state.game.q}` !== shown) { clearInterval(tick); return; }
      const current = new Set(connected().map((p) => p.uid));
      const n = Object.keys(state.answers).filter((uid) => current.has(uid)).length;
      stage(`Question ${g.q + 1} / ${g.qCount}`, [
        el('div', { className: 'bar' }, el('h1', { className: 'title q-text', textContent: q.text }), el('div', { className: 'clock', textContent: remaining() })),
        el('div', { className: 'grid4' }, ...q.choices.map((c, i) => choiceBox(i, c))),
      ], `${n} / ${current.size} réponses`);
    };
    tick = setInterval(draw, 500);
    return draw();
  }

  if (g.phase === 'reveal') {
    const counts = q.choices.map((_, i) => Object.values(state.answers).filter((a) => a.c === i).length);
    return stage(`Question ${g.q + 1} / ${g.qCount} · correction`, [
      el('h1', { className: 'title q-text', textContent: q.text }),
      el('div', { className: 'grid4' }, ...q.choices.map((c, i) => choiceBox(i, `${i === g.correct ? '✓ ' : ''}${c}`, i === g.correct ? 'right' : 'dim', counts[i]))),
      q.explanation ? el('div', { className: 'explain', textContent: q.explanation }) : '',
    ], `${Object.keys(state.answers).length} réponses`);
  }

  if (g.phase === 'roundEnd') {
    const top = Object.values(state.scores).sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, 'fr')).slice(0, 10);
    return stage(`Fin de la manche ${g.round}`, [
      el('h1', { className: 'title h-round', textContent: 'Classement' }),
      el('table', { className: 'board' }, ...top.map((r) => el('tr', {},
        el('td', { className: 'rank', textContent: r.rank }), el('td', { textContent: r.name }),
        el('td', { textContent: `${r[`r${g.round}`] ?? 0} / ${g.qCount}` }), el('td', { textContent: `total ${r.total}` })))),
    ], 'Classement par total, puis par rapidité à égalité (sans effet sur la note).');
  }
  stage('Quiz INSA 2026', []);
}
