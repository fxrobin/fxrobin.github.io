import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeScores, toCsv } from '../../quizz/js/scoring.js';

// Manche 1 : 2 questions (bonnes réponses 0 puis 1). Manche 2 : 1 question (bonne réponse 2).
const reveals = {
  1: { 0: { correct: 0, openedAt: 1000 }, 1: { correct: 1, openedAt: 5000 } },
  2: { 0: { correct: 2, openedAt: 9000 } },
};
const players = {
  ines: { name: 'Inès', uid: 'u1', uids: { u1: true } },
  hugo: { name: 'Hugo', uid: 'u2', uids: { u2: true } },
  lea: { name: 'Léa', uid: 'u3', uids: { u3: true } },
};
const answers = {
  1: {
    0: { u1: { c: 0, t: 2000 }, u2: { c: 0, t: 1500 }, u3: { c: 1, t: 1200 } },
    1: { u1: { c: 1, t: 6000 }, u2: { c: 1, t: 7000 }, u3: { c: 1, t: 5500 } },
  },
  2: { 0: { u1: { c: 2, t: 9500 }, u2: { c: 2, t: 9600 } } },
};

test('computeScores_counts_and_sorts', () => {
  const rows = computeScores({ players, answers, reveals });
  // Inès et Hugo ont 3 points ; Inès a le temps cumulé le plus court.
  assert.deepEqual(rows.map((r) => r.key), ['ines', 'hugo', 'lea']);
  const ines = rows[0];
  assert.deepEqual([ines.r1, ines.r2, ines.r3, ines.total], [2, 1, 0, 3]);
  assert.equal(ines.time, 1000 + 1000 + 500);
  assert.equal(ines.rank, 1);
  const hugo = rows[1];
  assert.equal(hugo.time, 500 + 2000 + 600);
  assert.deepEqual([hugo.total, hugo.rank], [3, 2]);
  const lea = rows[2];
  assert.deepEqual([lea.r1, lea.r2, lea.total, lea.rank], [1, 0, 1, 3]);
  assert.equal(lea.name, 'Léa');
});

test('computeScores_merges_uids', () => {
  const p = { lea: { name: 'Léa', uid: 'b', uids: { a: true, b: true } } };
  const a = { 1: { 0: { a: { c: 0, t: 1100 } } }, 2: { 0: { b: { c: 2, t: 9100 } } } };
  const [row] = computeScores({ players: p, answers: a, reveals });
  assert.deepEqual([row.r1, row.r2, row.total], [1, 1, 2]);
});

test('computeScores_ignores_unrevealed', () => {
  const a = { 3: { 0: { u1: { c: 0, t: 1 } } } };
  const rows = computeScores({ players, answers: a, reveals });
  assert.ok(rows.every((r) => r.total === 0));
});

test('computeScores_handles_empty_inputs', () => {
  assert.deepEqual(computeScores({ players: null, answers: null, reveals: null }), []);
  const rows = computeScores({ players, answers: null, reveals: null });
  assert.equal(rows.length, 3);
  assert.ok(rows.every((r) => r.total === 0 && r.rank === 1));
});

test('toCsv_format', () => {
  const csv = toCsv([
    { key: 'lea', name: 'Léa', r1: 5, r2: 5, r3: 6, total: 16 },
    { key: 'ines', name: 'Inès', r1: 6, r2: 7, r3: 6, total: 19 },
  ]);
  assert.ok(csv.startsWith('﻿prenom;m1;m2;m3;total\r\n'));
  const lines = csv.slice(1).split('\r\n');
  assert.equal(lines[1], 'Inès;6;7;6;19');
  assert.equal(lines[2], 'Léa;5;5;6;16');
});

test('computeScores_one_point_per_player_per_question', () => {
  // Après « Libérer », l'ancien et le nouvel appareil de Léa répondent juste à la même question.
  const p = { lea: { name: 'Léa', uid: 'b', uids: { a: true, b: true } } };
  const a = { 1: { 0: { a: { c: 0, t: 1100 }, b: { c: 0, t: 1200 } } } };
  const [row] = computeScores({ players: p, answers: a, reveals });
  assert.deepEqual([row.r1, row.total], [1, 1]);
});

test('computeScores_uid_belongs_to_current_owner', () => {
  // u1 a été libéré de « Léa » puis utilisé pour « Zoé » : ses réponses vont à Zoé.
  const p = {
    lea: { name: 'Léa', uid: 'u2', uids: { u1: true, u2: true } },
    zoe: { name: 'Zoé', uid: 'u1', uids: { u1: true } },
  };
  const a = { 1: { 0: { u1: { c: 0, t: 1100 } } } };
  const rows = computeScores({ players: p, answers: a, reveals });
  assert.equal(rows.find((r) => r.key === 'zoe').total, 1);
  assert.equal(rows.find((r) => r.key === 'lea').total, 0);
});

test('toCsv_neutralizes_formulas', () => {
  const csv = toCsv([{ key: 'x', name: "=cmd|'/c calc'!A1", r1: 0, r2: 0, r3: 0, total: 0 }]);
  assert.equal(csv.slice(1).split('\r\n')[1], "'=cmd|'/c calc'!A1;0;0;0;0");
});
