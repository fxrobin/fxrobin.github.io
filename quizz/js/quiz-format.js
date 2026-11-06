// Lecture du fichier de questions Markdown (format de preparation/quizz.md).
// Module pur, sans dépendance : utilisé par la page prof et par les tests Node.

const ROUND_RE = /^##\s+(.+?)\s*$/;
const QUESTION_RE = /^\*\*\s*(\d+)\.\s*(.+?)\s*\*\*\s*(?:\((\d+)\s*s\))?\s*$/;
const CORRECT_RE = /^-\s+\*\*(.+?)\*\*\s*\(bonne réponse\)\s*$/;
const CHOICE_RE = /^-\s+(.+?)\s*$/;
const EXPLAIN_RE = /^>\s*À dire\s*:\s*(.*?)\s*$/;

/**
 * @param {string} markdown
 * @returns {{ rounds: {title: string, questions: {text: string, choices: string[], correct: number, duration: number, explanation: string}[]}[], errors: string[] }}
 */
export function parseQuiz(markdown) {
  const rounds = [];
  const errors = [];
  let round = null;
  let q = null; // question en cours, avec champs de contrôle

  const closeQuestion = () => {
    if (!q) return;
    const where = `${round.title}, question ${q.number}`;
    if (q.duration === null) errors.push(`${where} : temps manquant, écrire (20 s) après la question.`);
    if (q.choices.length < 2 || q.choices.length > 4) errors.push(`${where} : ${q.choices.length} réponses, il en faut de 2 à 4.`);
    if (q.correctIdx.length === 0) errors.push(`${where} : aucune bonne réponse marquée.`);
    if (q.correctIdx.length > 1) errors.push(`${where} : ${q.correctIdx.length} bonnes réponses, il en faut une seule.`);
    round.questions.push({
      text: q.text,
      choices: q.choices,
      correct: q.correctIdx.length === 1 ? q.correctIdx[0] : -1,
      duration: q.duration ?? 0,
      explanation: q.explanation,
    });
    q = null;
  };

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const r = line.match(ROUND_RE);
    if (r) {
      closeQuestion();
      round = { title: r[1], questions: [] };
      rounds.push(round);
      continue;
    }
    if (!round) continue; // préambule ignoré

    const m = line.match(QUESTION_RE);
    if (m) {
      closeQuestion();
      q = { number: Number(m[1]), text: m[2], duration: m[3] ? Number(m[3]) : null, choices: [], correctIdx: [], explanation: '' };
      continue;
    }
    if (!q) continue;

    const c = line.match(CORRECT_RE);
    if (c) {
      q.correctIdx.push(q.choices.length);
      q.choices.push(c[1]);
      continue;
    }
    const ch = line.match(CHOICE_RE);
    if (ch) {
      q.choices.push(ch[1]);
      continue;
    }
    const e = line.match(EXPLAIN_RE);
    if (e) q.explanation = e[1];
  }
  if (round) closeQuestion();
  for (const rd of rounds) {
    if (rd.questions.length === 0) errors.push(`${rd.title} : aucune question.`);
  }
  if (rounds.length === 0) errors.push('Aucune manche trouvée : chaque manche commence par ## Titre.');
  return { rounds, errors };
}
