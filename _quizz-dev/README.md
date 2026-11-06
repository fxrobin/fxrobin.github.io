# Outillage de test du quiz `/quizz`

Dossier non publié (préfixe `_` ignoré par Jekyll). Le code publié est dans `../quizz/`.

## Installation

`package.json` est ignoré par le `.gitignore` du blog. Le recréer s'il manque :

```json
{ "name": "quizz-dev", "private": true, "type": "module",
  "devDependencies": { "@firebase/rules-unit-testing": "5.0.2", "firebase": "12.19.0", "firebase-tools": "15.35.0" } }
```

puis `npm install` dans ce dossier. Java 21 est requis pour l'émulateur.

## Tests

Depuis la racine du blog, logique pure (Markdown, prénoms, notes) :

```bash
QUIZZ_MD=~/talks/insa-2026-dev-augmente/preparation/quizz.md node --test _quizz-dev/tests/quiz-format.test.js _quizz-dev/tests/names.test.js _quizz-dev/tests/scoring.test.js
```

Depuis ce dossier, règles de sécurité sur l'émulateur :

```bash
npx firebase emulators:exec --only database --project demo-quizz "node --test tests/rules.test.js"
```

## Essai local dans le navigateur

```bash
npx firebase emulators:start --only database,auth --project demo-quizz   # interface : http://<IP WSL>:4001
python3 -m http.server 8099 --bind 0.0.0.0                                # depuis la racine du blog
```

Puis `http://<IP WSL>:8099/quizz/?emu=1` (élève) et `http://<IP WSL>:8099/quizz/prof.html?emu=1` (prof).

## Production

Les règles de `database.rules.json` sont à coller dans la console Firebase du projet `quizz-insa` (Realtime Database > Règles > Publier).

## Questions

Les questions sont stockées dans Firebase sous `/quiz/md` (lecture et écriture réservées au compte prof), jamais dans les fichiers publiés du site. La page prof les charge automatiquement après la connexion Google.

Pour les modifier : éditer `~/talks/insa-2026-dev-augmente/preparation/quizz.md`, puis le déposer sur la page prof (zone « Dépose ici »). Le nouveau fichier remplace l'ancien en ligne s'il ne contient aucune erreur.
