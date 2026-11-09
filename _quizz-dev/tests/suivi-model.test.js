import { test } from 'node:test';
import assert from 'node:assert/strict';
import { followUp } from '../../quizz/js/suivi-model.js';

// Manche de 3 questions : bonnes réponses 0, 1, 2. Q0 corrigée, Q1 en cours.
const questions = [
  { text: 'Q0', choices: ['a', 'b'], correct: 0 },
  { text: 'Q1', choices: ['a', 'b', 'c', 'd'], correct: 1 },
  { text: 'Q2', choices: ['a', 'b', 'c'], correct: 2 },
];
const players = {
  ines: { name: 'Inès', uid: 'u1', uids: { u1: true } },
  hugo: { name: 'Hugo', uid: 'u3', uids: { u2: true, u3: true } }, // a changé d'appareil
  lea: { name: 'Léa', uid: 'u4', uids: { u4: true } },
  zoe: { name: 'Zoé', uid: 'u5', free: true, uids: { u5: true } },
};
const reveals = { 0: { correct: 0, openedAt: 1000 } };
const answers = {
  0: { u1: { c: 0, t: 3000 }, u2: { c: 1, t: 2000 }, u3: { c: 0, t: 2500 } },
  1: { u1: { c: 1, t: 11500 }, u4: { c: 3, t: 12000 } },
};
const game = { phase: 'question', round: 1, q: 1, openedAt: 10000, duration: 40 };
const base = { players, answers, reveals, game, questions, present: new Set(['u1', 'u3', 'u5', 'u9']), acks: { u1: true, u3: true } };
const row = (res, key) => res.rows.find((r) => r.key === key);

test('followUp_marks_cells_right_or_wrong_with_delay', () => {
  const ines = row(followUp(base), 'ines');
  assert.deepEqual(ines.cells[0], { c: 0, ok: true, delay: 2 });
  assert.deepEqual(ines.cells[1], { c: 1, ok: true, delay: 1.5 });
  assert.equal(ines.cells[2], null);
  assert.equal(ines.score, 2);
  assert.deepEqual(ines.current, { c: 1, ok: true, delay: 1.5 });
});

test('followUp_keeps_earliest_answer_across_devices', () => {
  const hugo = row(followUp(base), 'hugo');
  assert.equal(hugo.devices, 2);
  assert.deepEqual(hugo.cells[0], { c: 1, ok: false, delay: 1 });
});

test('followUp_reports_presence_readiness_and_orphans', () => {
  const res = followUp(base);
  assert.equal(row(res, 'lea').online, false);
  assert.equal(row(res, 'hugo').ready, true);
  assert.equal(res.stats.enrolled, 3);
  assert.equal(res.stats.online, 2);
  assert.equal(res.stats.orphans, 2); // u9 inconnu + u5 libéré
  assert.ok(res.alerts.some((a) => a.level === 'ko' && a.text.includes('Léa')));
  assert.ok(res.alerts.some((a) => a.text.includes("changé d'appareil : Hugo")));
});

test('followUp_live_distribution_counts_every_sent_answer', () => {
  const { stats } = followUp(base);
  assert.deepEqual(stats.distribution, [0, 1, 0, 1]); // Léa est hors ligne, mais sa réponse envoyée compte
  assert.equal(stats.answered, 2);
  assert.equal(stats.rightRate, 0.5);
  assert.deepEqual(stats.perQuestion[0], { answered: 2, right: 1, revealed: true });
});

test('followUp_outside_a_question_has_no_current_state', () => {
  const res = followUp({ ...base, game: { phase: 'lobby', round: 1, q: 0 } });
  assert.equal(res.stats.ready, null);
  assert.equal(row(res, 'ines').current, null);
  assert.deepEqual(res.stats.distribution, []);
});

test('followUp_ignores_readiness_once_corrected', () => {
  const res = followUp({ ...base, game: { ...game, phase: 'reveal' } });
  assert.equal(res.stats.ready, null);
  assert.deepEqual(row(res, 'ines').current, { c: 1, ok: true, delay: 1.5 });
});
