// Tests des règles Realtime Database sur l'émulateur.
// Lancer : npx firebase emulators:exec --only database --project demo-quizz "node --test tests/rules.test.js"
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { ref, set, get, update, serverTimestamp } from 'firebase/database';

const TEACHER = { email: 'fxrobin@gmail.com', email_verified: true };
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-quizz',
    database: {
      host: '127.0.0.1',
      port: 9000,
      rules: readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8'),
    },
  });
});
after(async () => env?.cleanup());
beforeEach(async () => env.clearDatabase());

const teacherDb = () => env.authenticatedContext('prof', TEACHER).database();
const studentDb = (uid) => env.authenticatedContext(uid).database();

/** Écrit l'état initial sans passer par les règles. */
async function seed(data) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await set(ref(ctx.database(), '/'), data);
  });
}

const openQuestion = (extra = {}) => ({
  game: { phase: 'question', round: 1, title: 'Manche 1', q: 0, qCount: 6, nChoices: 4, openedAt: Date.now(), duration: 20, correct: null, ...extra },
});

test('student_cannot_read_reveals_or_answers', async () => {
  await seed({ ...openQuestion(), reveals: { 1: { 0: { correct: 2, openedAt: 1 } } }, answers: { 1: { 0: { x: { c: 1, t: 1 } } } } });
  const db = studentDb('u1');
  await assertFails(get(ref(db, 'reveals')));
  await assertFails(get(ref(db, 'answers/1/0')));
  await assertSucceeds(get(ref(teacherDb(), 'reveals')));
});

test('student_reads_game_without_correct_during_question', async () => {
  await seed(openQuestion());
  const snap = await assertSucceeds(get(ref(studentDb('u1'), 'game')));
  if (snap.val().correct !== undefined && snap.val().correct !== null) throw new Error('correct visible');
});

test('anonymous_visitor_cannot_read_game', async () => {
  await seed(openQuestion());
  await assertFails(get(ref(env.unauthenticatedContext().database(), 'game')));
});

test('student_cannot_write_game', async () => {
  await seed(openQuestion());
  await assertFails(set(ref(studentDb('u1'), 'game/correct'), 2));
  await assertSucceeds(set(ref(teacherDb(), 'game/correct'), 2));
});

test('teacher_with_other_email_denied', async () => {
  const db = env.authenticatedContext('x', { email: 'autre@gmail.com', email_verified: true }).database();
  await assertFails(set(ref(db, 'game/phase'), 'lobby'));
  const unverified = env.authenticatedContext('y', { email: 'fxrobin@gmail.com', email_verified: false }).database();
  await assertFails(set(ref(unverified, 'game/phase'), 'lobby'));
});

const claim = (db, key, name, uid) => update(ref(db), {
  [`players/${key}/name`]: name,
  [`players/${key}/uid`]: uid,
  [`players/${key}/free`]: false,
  [`players/${key}/uids/${uid}`]: true,
});

test('student_claims_free_name', async () => {
  await assertSucceeds(claim(studentDb('u1'), 'lea', 'Léa', 'u1'));
});

test('second_student_cannot_claim_taken_name', async () => {
  await assertSucceeds(claim(studentDb('u1'), 'lea', 'Léa', 'u1'));
  await assertFails(update(ref(studentDb('u2')), {
    'players/lea/uid': 'u2', 'players/lea/free': false, 'players/lea/uids/u2': true,
  }));
  await assertFails(claim(studentDb('u2'), 'lea', 'Léa', 'u2'));
});

test('student_cannot_claim_for_another_uid', async () => {
  await assertFails(claim(studentDb('u1'), 'lea', 'Léa', 'u9'));
});

test('released_name_can_be_reclaimed', async () => {
  await assertSucceeds(claim(studentDb('u1'), 'lea', 'Léa', 'u1'));
  await assertFails(set(ref(studentDb('u1'), 'players/lea/free'), true));
  await assertSucceeds(set(ref(teacherDb(), 'players/lea/free'), true));
  await assertSucceeds(update(ref(studentDb('u2')), {
    'players/lea/uid': 'u2', 'players/lea/free': false, 'players/lea/uids/u2': true,
  }));
  const snap = await get(ref(teacherDb(), 'players/lea'));
  const p = snap.val();
  if (p.uid !== 'u2' || !p.uids.u1 || !p.uids.u2 || p.name !== 'Léa') throw new Error(JSON.stringify(p));
});

test('student_cannot_delete_player', async () => {
  await assertSucceeds(claim(studentDb('u1'), 'lea', 'Léa', 'u1'));
  await assertFails(set(ref(studentDb('u1'), 'players/lea'), null));
  await assertSucceeds(set(ref(teacherDb(), 'players/lea'), null));
});

const answer = (db, uid, c, r = 1, q = 0) => set(ref(db, `answers/${r}/${q}/${uid}`), { c, t: serverTimestamp() });

test('answer_once_while_open', async () => {
  await seed(openQuestion());
  const db = studentDb('u1');
  await assertSucceeds(answer(db, 'u1', 2));
  await assertFails(answer(db, 'u1', 1));
});

test('answer_for_other_question_denied', async () => {
  await seed(openQuestion());
  await assertFails(answer(studentDb('u1'), 'u1', 1, 1, 1));
  await assertFails(answer(studentDb('u1'), 'u1', 1, 2, 0));
});

test('answer_for_other_uid_denied', async () => {
  await seed(openQuestion());
  await assertFails(answer(studentDb('u1'), 'u2', 1));
});

test('answer_out_of_range_denied', async () => {
  await seed(openQuestion({ nChoices: 2 }));
  await assertFails(answer(studentDb('u1'), 'u1', 2));
  await assertFails(answer(studentDb('u1'), 'u1', -1));
  await assertSucceeds(answer(studentDb('u1'), 'u1', 1));
});

test('answer_after_deadline_denied', async () => {
  await seed(openQuestion({ openedAt: Date.now() - (20 * 1000 + 5000) }));
  await assertFails(answer(studentDb('u1'), 'u1', 0));
});

test('answer_when_closed_denied', async () => {
  await seed(openQuestion({ phase: 'reveal', correct: 0 }));
  await assertFails(answer(studentDb('u1'), 'u1', 0));
});

test('student_reads_only_own_score', async () => {
  await assertSucceeds(claim(studentDb('u1'), 'lea', 'Léa', 'u1'));
  await assertSucceeds(set(ref(teacherDb(), 'scores/lea'), { name: 'Léa', r1: 1, r2: 0, r3: 0, total: 1, rank: 1 }));
  await assertSucceeds(set(ref(teacherDb(), 'scores/hugo'), { name: 'Hugo', r1: 0, r2: 0, r3: 0, total: 0, rank: 2 }));
  await assertSucceeds(get(ref(studentDb('u1'), 'scores/lea')));
  await assertFails(get(ref(studentDb('u1'), 'scores/hugo')));
  await assertFails(get(ref(studentDb('u1'), 'scores')));
  await assertFails(get(ref(studentDb('u2'), 'scores/lea')));
  await assertFails(set(ref(studentDb('u1'), 'scores/lea/total'), 20));
  await assertSucceeds(get(ref(teacherDb(), 'scores')));
});

test('quiz_file_readable_only_by_teacher', async () => {
  await assertSucceeds(set(ref(teacherDb(), 'quiz'), { md: '## Manche 1\n', updatedAt: 1 }));
  await assertSucceeds(get(ref(teacherDb(), 'quiz/md')));
  await assertFails(get(ref(studentDb('u1'), 'quiz')));
  await assertFails(get(ref(studentDb('u1'), 'quiz/md')));
  await assertFails(set(ref(studentDb('u1'), 'quiz/md'), 'piratage'));
  await assertFails(get(ref(env.unauthenticatedContext().database(), 'quiz/md')));
});

test('teacher_resets_everything', async () => {
  await seed({ ...openQuestion(), answers: { 1: { 0: { u1: { c: 1, t: 1 } } } }, reveals: { 1: { 0: { correct: 1, openedAt: 1 } } } });
  await assertSucceeds(update(ref(teacherDb()), { game: null, players: null, answers: null, reveals: null, scores: null }));
});
