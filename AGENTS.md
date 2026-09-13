# AGENTS.md

Conventions et guide pour les agents IA travaillant sur ce dépôt.

## À propos

Blog technique personnel — [www.fxjavadevblog.fr](https://www.fxjavadevblog.fr).
Stack : **Jekyll** (générateur de site statique) + **GitHub Pages** (CI/CD).
Thèmes : Java, APIs, Linux, retro-computing.
Branche principale : `master`.

## Build et prévisualisation

Pas de Gemfile. Le site est construit via Docker avec un script bash :

```bash
jkl          # si le script est dans le PATH
/_bin/jkl    # sinon, depuis la racine du dépôt
```

Le CI s'exécute sur push/PR vers `master` via `.github/workflows/jekyll.yml`.

### Serveur de dev : vérifier en début de conversation

`jkl` tourne en général déjà en mode **watch** sur le port **4000** (rebuild automatique à chaque modification).

**En début de conversation, vérifier que Jekyll répond :**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/
```

- `200` : le serveur tourne. Ne pas relancer `jkl`, ne pas lancer un second `jekyll serve`.
- Pas de réponse : signaler à l'utilisateur que Jekyll ne tourne pas et lui demander de lancer `jkl`. Ne pas le démarrer soi-même.

Prévisualisation : `http://localhost:4000/<chemin-de-la-page>`. Après une modification, attendre le rebuild (quelques secondes) avant de recharger.

## Structure du contenu

### Catégories

| Chemin | Type |
|---|---|
| `_posts/articles/` | Articles Java/Linux/APIs (chaque article dans son propre sous-dossier) |
| `_posts/retro-prog/` | Retro-computing (m68k, 6809, Atari ST) |
| `_posts/blanka-cave/` | Opinions / éditoriaux |
| `_drafts/` | En cours de rédaction — consulter `_drafts/PLAN.md` pour le plan éditorial |

### Système multilingue

Chaque article a un champ `lang` (`fr` ou `en`) et un champ `ref`.
Les articles partageant le même `ref` sont des variantes linguistiques.
`language-selector.html` utilise `ref` pour lier les versions entre elles.

### Nom de fichier

`_posts/<catégorie>/<slug>/YYYY-MM-DD-<slug>-<lang>.md`

Exemple : `_posts/articles/eclipse-collections/2026-04-03-eclipse-collections-fr.md`

### Excerpt

Placer `<!--excerpt-->` à l'endroit où le teaser doit s'arrêter dans la liste des articles.

## Conventions de rédaction

Référence complète : skill `fxjavadevblog-article-writing`.

### Front matter obligatoire

```yaml
---
layout: post
title: "..."
subtitle: "..."
logo: filename.png        # depuis /images/logos/
category: articles        # ou retro-prog, blanka-cave
tags: [tag1, tag2]
lang: fr                  # ou en
ref: unique-post-ref      # identique pour les variantes linguistiques
permalink: /mon-article/
---
```

### Voix et ton

- **Tutoiement** pour les articles rétro, **vouvoiement** pour les articles Java/tech
- Première personne directe : "j'ai choisi", "après 4 ans d'usage"
- Humour léger : références cinéma, expressions familières
- L'intro se termine sur une friction ou une promesse, jamais sur une conclusion

### Typographie

| Interdit | Correct |
|---|---|
| Tiret long `—` ou `…` (Unicode) | ` - ` ou `...` (trois points ASCII) |
| Guillemets courbes `"` `'` | Guillemets droits `"` `'` |
| Emojis UTF-8 (✅, ❌, ⚠️) | Texte seul ou symboles ASCII ([x], [!]) |
| "Il est important de noter que..." | Affirmer directement, sans intro creuse |

## Chemins clés

| Répertoire | Rôle |
|---|---|
| `_layouts/` | Modèles de page (post, page, blog_index, cv-layout, etc.) |
| `_includes/` | Partials réutilisables (sidebar, TOC, tags, language-selector, etc.) |
| `_sass/` | 27 partials SCSS, compilés via `style.scss` |
| `_config.yml` | Configuration site (multilingual, plugins, permalien, etc.) |
| `images/` | Images statiques |
| `js/` | JavaScript |
| `terminal-cv/` | Widget CV terminal interactif (JS pur) |
| `fonts/` | Polices custom (amiga, atari, volter, etc.) |

## Skills disponibles

| Skill | Quand l'utiliser |
|---|---|
| `fxjavadevblog-architecture` | Naviguer/éditer les layouts, includes, styles, système multilingue |
| `fxjavadevblog-article-writing` | Créer ou modifier un article (structure, ton, typographie, anti-AI tics) |

## Gardes-fous

- Ne jamais éditer les fichiers dans `_site/` (répertoire de build, régénéré à chaque build)
- Ne jamais committer un fichier dans `_drafts/` sans accord explicite
- Ne pas modifier `_config.yml` sans raison valable (impact global sur le site)
- Ne pas supprimer ou renommer un permalink sans redirection (`redirect_from:` dans le front matter)
- Les fichiers `.gitignore` exclus ne doivent jamais être commités : `_site`, `.jekyll-cache`, `.sass-cache`, `Gemfile`, `node_modules`
- Toujours vérifier que les variantes linguistiques (même `ref`) ont un front matter cohérent
