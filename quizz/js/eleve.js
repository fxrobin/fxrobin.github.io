// Page élève : rejoindre avec un prénom, répondre, voir juste ou faux.
import {
  auth, db, ref, onValue, update, get, set, serverTimestamp, signInAnonymously, onAuthStateChanged, serverNow,
} from './firebase.js';
import { cleanName, nameKey, validateName, NAME_TAKEN } from './names.js';
import { CHOICES, show } from './ui.js';

const SECTIONS = ['join', 'wait', 'question', 'sent', 'end'];
const $ = (id) => document.getElementById(id);
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
};

let uid = null;
let me = null; // { key, name }
let game = null;
let score = null;
let playerCount = 0;
let timer = null;
let unsubs = [];

// La session (posée par la page prof à chaque réinitialisation) évite qu'une réponse
// d'une partie de test bloque la même question le jour J sur le même téléphone.
const answerKey = (g) => `quizz.answer.${g.session ?? 's'}.${g.round}.${g.q}`;

// ---- Rejoindre -------------------------------------------------------------

async function claim(name) {
  const key = nameKey(name);
  const pRef = ref(db, `players/${key}`);
  const snap = await get(pRef);
  const p = snap.val();
  if (p && p.uid === uid) {
    // Prénom libéré par erreur puis repris depuis le même téléphone : on le marque de nouveau pris.
    if (p.free === true) await update(ref(db, `players/${key}`), { free: false });
    return { key, name: p.name };
  }
  const updates = { [`players/${key}/uid`]: uid, [`players/${key}/free`]: false, [`players/${key}/uids/${uid}`]: true };
  if (!p) updates[`players/${key}/name`] = name;
  else if (p.free !== true) throw new Error(NAME_TAKEN);
  try {
    await update(ref(db), updates);
  } catch {
    throw new Error(NAME_TAKEN);
  }
  return { key, name: p ? p.name : name };
}

$('join-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const name = cleanName($('name').value);
  const err = validateName(name);
  $('join-error').textContent = err ?? '';
  if (err || !uid) return;
  $('join-btn').disabled = true;
  try {
    me = await claim(name);
    store.set('quizz.name', name);
    joined();
  } catch (e) {
    $('join-error').textContent = e.message || NAME_TAKEN;
  } finally {
    $('join-btn').disabled = false;
  }
});

async function tryResume() {
  const saved = store.get('quizz.name');
  if (saved) $('name').value = saved;
  if (!saved) return false;
  const key = nameKey(saved);
  try {
    const snap = await get(ref(db, `players/${key}`));
    if (snap.exists() && snap.val().uid === uid) {
      me = { key, name: snap.val().name };
      return true;
    }
  } catch { /* hors ligne : on reste sur l'écran d'arrivée */ }
  return false;
}

function joined() {
  $('me').textContent = me.name;
  unsubs.forEach((u) => u());
  unsubs = [
    onValue(ref(db, 'game'), (s) => { game = s.val(); render(); }),
    onValue(ref(db, `scores/${me.key}`), (s) => { score = s.val(); render(); }),
    onValue(ref(db, 'players'), (s) => { playerCount = s.size; render(); }),
    onValue(ref(db, `players/${me.key}/uid`), (s) => {
      // Prénom repris ailleurs, ou partie réinitialisée : ce téléphone doit se réinscrire.
      if (s.val() !== uid) {
        me = null; unsubs.forEach((u) => u()); unsubs = [];
        showJoin(s.exists() ? 'Ce prénom est utilisé sur un autre appareil.' : "Tu n'es plus inscrit : rejoins de nouveau la partie.");
      }
    }),
  ];
}

function showJoin(message = '') {
  $('join-error').textContent = message;
  $('me').textContent = 'Quiz INSA 2026';
  $('status').textContent = '';
  hideVerdict();
  show(SECTIONS, 'join');
}

// ---- Affichage selon la phase ----------------------------------------------

function hideVerdict() { $('verdict').hidden = true; }

function wait(kicker, title, text = '') {
  hideVerdict();
  $('wait-kicker').textContent = kicker;
  $('wait-title').textContent = title;
  $('wait-text').textContent = text;
  show(SECTIONS, 'wait');
}

function render() {
  clearInterval(timer);
  if (!me) return;
  const g = game;
  if (!g || g.phase === 'idle' || !g.phase) {
    $('status').textContent = '';
    return wait('En attente', 'Tu es inscrit', 'La prochaine manche va bientôt commencer.');
  }
  $('status').textContent = g.phase === 'question' || g.phase === 'reveal' ? `Q${g.q + 1}/${g.qCount}` : `Manche ${g.round}`;
  if (g.phase === 'lobby') return wait(g.title || `Manche ${g.round}`, "Regarde l'écran", 'Tu es dans la partie.');
  if (g.phase === 'question') return renderQuestion(g);
  if (g.phase === 'reveal') return renderReveal(g);
  if (g.phase === 'roundEnd') return renderEnd(g);
  return wait('En attente', "Regarde l'écran");
}

function remaining(g) {
  return Math.min(g.duration, Math.max(0, Math.ceil(g.duration - (serverNow() - g.openedAt) / 1000)));
}

function renderQuestion(g) {
  hideVerdict();
  const mine = store.get(answerKey(g)) ?? (pending.has(answerKey(g)) ? 'pending' : null);
  if (mine === 'pending') {
    $('sent-shape').textContent = '';
    $('sent').querySelector('.mono').textContent = 'Envoi en cours';
    show(SECTIONS, 'sent');
    return;
  }
  if (mine !== null) {
    $('sent-shape').textContent = mine === 'late' ? '' : `${CHOICES[Number(mine)].shape} ${CHOICES[Number(mine)].letter}`;
    $('sent').querySelector('.mono').textContent = mine === 'late' ? 'Trop tard' : 'Réponse envoyée';
    show(SECTIONS, 'sent');
    return;
  }
  $('sent').querySelector('.mono').textContent = 'Réponse envoyée';
  const box = $('answers');
  box.className = `answers${g.nChoices === 2 ? ' two' : ''}`;
  box.replaceChildren(...CHOICES.slice(0, g.nChoices).map((ch, i) => {
    const b = document.createElement('button');
    b.className = ch.cls;
    b.setAttribute('aria-label', `Réponse ${ch.letter}`);
    b.innerHTML = `<span class="shape" aria-hidden="true">${ch.shape}</span><span class="letter">${ch.letter}</span>`;
    b.addEventListener('click', () => answer(g, i), { once: true });
    return b;
  }));
  show(SECTIONS, 'question');
  const tick = () => {
    const s = remaining(g);
    $('status').textContent = `Q${g.q + 1}/${g.qCount} · ${s} s`;
    if (s <= 0) { clearInterval(timer); wait('Temps écoulé', "Regarde l'écran"); }
  };
  tick();
  timer = setInterval(tick, 250);
}

const pending = new Set(); // réponses envoyées, en attente de confirmation du serveur

async function answer(g, choice) {
  const k = answerKey(g);
  if (pending.has(k) || store.get(k) !== null) return; // un seul envoi par question
  pending.add(k);
  for (const b of $('answers').querySelectorAll('button')) b.disabled = true;
  try {
    await set(ref(db, `answers/${g.round}/${g.q}/${uid}`), { c: choice, t: serverTimestamp() });
    store.set(k, String(choice));
  } catch {
    if (store.get(k) === null) store.set(k, 'late');
  } finally {
    pending.delete(k);
  }
  render();
}

function renderReveal(g) {
  const mine = store.get(answerKey(g));
  const picked = mine !== null && mine !== 'late' ? Number(mine) : null;
  const ok = picked !== null && picked === g.correct;
  $('verdict').className = `verdict ${ok ? 'ok' : 'ko'}`;
  $('verdict-mark').textContent = ok ? '✓' : '✗';
  $('verdict-title').textContent = ok ? 'Juste' : picked === null ? 'Pas de réponse' : 'Faux';
  const n = score ? score[`r${g.round}`] ?? 0 : 0;
  $('verdict-score').textContent = `${n} / ${g.q + 1} dans cette manche`;
  $('verdict').hidden = false;
}

function renderEnd(g) {
  hideVerdict();
  const n = score ? score[`r${g.round}`] ?? 0 : 0;
  $('end-kicker').textContent = `Fin de la manche ${g.round}`;
  $('end-round').textContent = `${n} / ${g.qCount}`;
  $('end-total').textContent = `Total : ${score?.total ?? 0} / 20`;
  $('end-rank').textContent = score?.rank ? `Classement : ${score.rank}${score.rank === 1 ? 'er' : 'e'} sur ${playerCount}` : '';
  show(SECTIONS, 'end');
}

// ---- Démarrage -------------------------------------------------------------

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  uid = user.uid;
  if (await tryResume()) joined();
  else showJoin();
});

signInAnonymously(auth).catch(() => {
  $('join-error').textContent = 'Connexion impossible. Vérifie ta connexion internet puis recharge la page.';
  show(SECTIONS, 'join');
});
