import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseQuiz } from '../../quizz/js/quiz-format.js';

const md = (s) => s.trim() + '\n';

test('parseQuiz_reads_real_file', { skip: !process.env.QUIZZ_MD }, () => {
  const { rounds, errors } = parseQuiz(readFileSync(process.env.QUIZZ_MD, 'utf8'));
  assert.deepEqual(errors, []);
  assert.equal(rounds.length, 3);
  assert.deepEqual(rounds.map((r) => r.questions.length), [6, 7, 7]);
  assert.equal(rounds[0].title, "Manche 1 · Anatomie d'un agent");
  const q = rounds[0].questions[0];
  assert.equal(q.text, "Qu'est-ce qui distingue un agent d'un simple chat ?");
  assert.equal(q.choices.length, 4);
  assert.equal(q.choices[q.correct], "Il enchaîne des appels d'outils sur un environnement réel");
  assert.equal(q.duration, 20);
  assert.match(q.explanation, /^(Note de la )?[Ss]lide \d+ :/);
});

test('parseQuiz_true_false', () => {
  const { rounds, errors } = parseQuiz(md(`
## Manche 1 · Test

**1. Plus de contexte, c'est toujours mieux.** (20 s)

- Vrai
- **Faux** (bonne réponse)

> À dire : Non.
`));
  assert.deepEqual(errors, []);
  const q = rounds[0].questions[0];
  assert.deepEqual(q.choices, ['Vrai', 'Faux']);
  assert.equal(q.correct, 1);
  assert.equal(q.text, "Plus de contexte, c'est toujours mieux.");
  assert.equal(q.explanation, 'Non.');
});

test('parseQuiz_reports_errors', () => {
  const { errors } = parseQuiz(md(`
## Manche 1 · Erreurs

**1. Sans bonne réponse ?** (20 s)

- A
- B

**2. Cinq réponses ?** (20 s)

- **A** (bonne réponse)
- B
- C
- D
- E

**3. Sans temps ?**

- **A** (bonne réponse)
- B

**4. Deux bonnes ?** (20 s)

- **A** (bonne réponse)
- **B** (bonne réponse)
`));
  assert.equal(errors.length, 4);
  for (const [i, e] of errors.entries()) {
    assert.match(e, /Manche 1/);
    assert.match(e, new RegExp(`question ${i + 1}\\b`));
  }
});

test('parseQuiz_ignores_preamble', () => {
  const { rounds, errors } = parseQuiz(md(`
# Titre du fichier

Texte libre avec - une liste
- et un faux item **gras** (bonne réponse)

## Manche 1 · Vraie

**1. Question ?** (30 s)

- **Oui** (bonne réponse)
- Non
`));
  assert.deepEqual(errors, []);
  assert.equal(rounds.length, 1);
  assert.equal(rounds[0].questions.length, 1);
  assert.equal(rounds[0].questions[0].duration, 30);
  assert.equal(rounds[0].questions[0].explanation, '');
});
