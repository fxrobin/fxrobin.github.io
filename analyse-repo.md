# Audit du Repository — FX JavaDevBlog

**Date :** 18 avril 2026  
**Repository :** `fxrobin/fxrobin.github.io`  
**Site :** https://www.fxjavadevblog.fr  
**Auditeur :** Claude Code

---

## Résumé Exécutif

Blog technique Jekyll bien structuré, focalisé Java/rétro/architecture. Infrastructure solide, automatisation complète. Contenu à 68% vieux de 5+ ans, mais reprise notable en avril 2026.

**Bilan santé global :**

| Dimension | Note | Commentaire |
|-----------|------|-------------|
| Infrastructure | ★★★★★ | CI/CD, Docker, plugins |
| Structure contenu | ★★★★☆ | Conventions cohérentes |
| SEO | ★★★☆☆ | Plugins OK, JSON-LD absent |
| Couverture bilingue | ★★☆☆☆ | 18% EN seulement |
| Fréquence publication | ★★☆☆☆ | Gaps 2 ans répétés |
| Performance frontend | ★★★☆☆ | CDN OK, CSS non-minifié |

---

## 1. Contenu

### 1.1 Volume et distribution

| Catégorie | Total | FR | EN | Récents (≤2 ans) | Moyens (2–5 ans) | Anciens (5+ ans) |
|-----------|-------|----|----|-------------------|-------------------|-------------------|
| Articles | 23 | 17 | 6 | 4 | 4 | 15 |
| Blanka Cave | 10 | 10 | 0 | 0 | 0 | 10 |
| Retro-Prog | 11 | 9 | 2 | 2 | 4 | 5 |
| **TOTAL** | **44** | **36** | **8** | **6** | **8** | **30** |

**Distribution linguistique :**
- Français : 36 posts (81%)
- Anglais : 8 posts (18%)
- Paires bilingues (même `ref`) : 8

### 1.2 Timeline de publication

```
2018 : 21 posts  ★★★★★  Lancement / pic d'activité
2019 : 0 posts   ——————  GAP 1 (2 ans)
2020 : 4 posts   ★★
2021 : 8 posts   ★★★★
2022 : 3 posts   ★
2023 : 2 posts   ★
2024 : 2 posts   ★       GAP 2 (24 mois)
2025 : 0 posts   ——————
2026 : 4 posts   ★★      Reprise (avril 2026)
```

**Pics :**
- Juillet 2018 : 7 posts (lancement Blanka Cave)
- Mars 2018 : 5 posts
- Avril 2026 : 4 posts (reprise actuelle)

### 1.3 Thématiques et tags

**73 tags uniques.** Top 10 :

| Tag | Occurrences |
|-----|-------------|
| Java | 13 |
| Retro / Retro-Prog | 11 |
| Atari | 9 |
| C | 6 |
| Assembleur | 5 |
| Lambda / Functional | 4 |
| JPA / Lombok | 3 |
| Maven / Bean Validation | 2–3 |

**Clusters thématiques :**
- Rétro computing (Atari ST, Thomson, 68000, 6809) : ~33%
- Java enterprise (CDI, JPA, Quarkus, GraalVM, JAX-RS) : ~27%
- DevOps/Tooling (Maven, Docker, GitHub) : ~14%
- Design patterns & craftsmanship : ~9%

**Couverture Java :** Java 8, 10, 12, 21 mentionnés dans des posts. Aucun article dédié aux versions Java.

### 1.4 Qualité des front matter

| Champ | Présence | Statut |
|-------|----------|--------|
| layout, title, lang, category | 44/44 | ✓ 100% |
| logo | 44/44 | ✓ 100% (référencé) |
| subtitle | 34/44 | ✓ 77% |
| ref | 34/44 | ✓ 77% |
| tags | 33/44 | ✓ 75% |
| excerpt marker `<!--excerpt-->` | 33/44 | ✓ 75% |

Les posts Blanka Cave sont intentionnellement minimalistes (pas de tags, pas de `ref`, `sitemap: false`).

### 1.5 Brouillons (_drafts/)

**9 fichiers markdown :**

| Fichier | Taille | Statut estimé |
|---------|--------|---------------|
| `PLAN.md` | — | Plan éditorial |
| `a-rediger.md` | — | Placeholder |
| `questions-poo.md` | 13.2 KB | Quasi-publiable |
| `angular8-javaee.md` | — | Daté (Angular 8) |
| `choisir-js-angular-react-vue-webcomponents.md` | — | Daté |
| `cdi-payara-arquillian-deltaspike.md` | — | Abandonné probable |
| `focus-list.md` | — | Court |
| `gradle-travis-github.md` | — | Daté |
| `java-ee-nio.md` | — | Daté |

**7 répertoires de drafts en cours :**

| Répertoire | Sujet |
|------------|-------|
| `blog/` | Contenu générique |
| `maven-javadoc-lombok-java-21/` | Combo Maven + Java 21 |
| `minikube-helm-quarkus/` | Kubernetes + Quarkus |
| `uuid-versions-jmh/` | UUID v7, benchmarks JMH |
| `vertx-eventbus-quarkus/` | Vert.x EventBus |
| `virtual-threads-loom/` | Project Loom |
| `x-mas-architecture/` | Architecture de Noël |

---

## 2. Technologies

### 2.1 Jekyll

| Paramètre | Valeur |
|-----------|--------|
| Version Jekyll | v1.2.0 |
| Markdown | GFM (GitHub Flavored) |
| Syntax highlighter | Rouge |
| Pagination | 3 posts/page |
| Excerpt separator | `<!--excerpt-->` |
| Permalink par défaut | `/:title/` |
| Style CSS généré | `:expanded` (non-minifié) |

**Plugins activés (3) :**

| Plugin | Rôle |
|--------|------|
| `jekyll-sitemap` | Génération sitemap.xml automatique |
| `jekyll-seo-tag` | Meta tags SEO (OG, Twitter Card) |
| `jekyll-redirect-from` | Redirections d'URL legacy |

`jekyll-feed` est commenté dans `_config.yml` — RSS désactivé intentionnellement.

### 2.2 CI/CD

**GitHub Actions** (`.github/workflows/jekyll.yml`) :
- Déclencheurs : push et PR sur `master`
- Runner : `ubuntu-latest`
- Container build : `jekyll/builder:latest`
- Commande : `jekyll build --future`
- Pas de Gemfile local, pas de Dockerfile — dépend entièrement du container officiel

### 2.3 Frontend

**Aucun `package.json`, aucun `npm`.** Tout via CDN :

| Bibliothèque | Version | Source | Usage |
|--------------|---------|--------|-------|
| TypewriterJS | 1.0.0 | CDNJS | Animation titre header |
| Vue.js | 2.5.16 | CDNJS | Composants réactifs (usage réel ?) |
| Axios | 0.18.0 | CDNJS | Requêtes AJAX |
| Font Awesome | 4.7.0 | CDNJS | Icônes |
| CSS Social Buttons | 1.3.0 | CDNJS | Boutons de partage |
| Mermaid | 10 | JSDelivr | Diagrammes (opt-in) |
| Asciinema | local | `/asciinema/` | Lectures terminales |

**JavaScript local (2 fichiers) :**
- `js/main.js` (2.8 KB) — Fonctionnalités core
- `js/cv-scroll-animations.js` (4.6 KB) — Animations page CV

### 2.4 Sass / CSS

**26 modules SCSS dans `_sass/` :**

| Module | Taille | Rôle |
|--------|--------|------|
| `_svg-icons.scss` | **52.6 KB** | SVG inline (icônes sociales) |
| `_base-rules.scss` | — | Typographie, base |
| `_post.scss` | — | Styles article |
| `_variables.scss` | — | Couleurs, polices |
| `_highlights.scss` | — | Coloration syntaxique |
| `_table-of-content.scss` | — | TOC |
| `_nav.scss`, `_search.scss`, `_blanka.scss`, `_retro-list.scss` | — | Composants spécifiques |
| `effects/` | — | Animations |
| 16 autres | — | Reset, mixins, layout |

**Polices custom** (`_fonts.scss`) : `amiga`, `atari`, `volter`, `coders-crux`, `Monda` — identité rétro/hacker forte.

**Stylesheets complémentaires :** `blink.css`, `hover.css`, `print.css`

### 2.5 Layouts et Includes

**7 layouts :**

```
_layouts/
├── default.html (5.2 KB)   ← Base : header, nav, footer, JS
│   ├── post.html (769 B)   ← Articles
│   ├── page.html (406 B)
│   ├── page-no-aside.html
│   ├── blog_index.html
│   ├── cv-layout.html
│   └── cv-new-layout.html
```

**25 includes** dont :

| Include | Taille | Rôle |
|---------|--------|------|
| `toc.html` | 3.8 KB | Générateur TOC automatique |
| `meta.html` | 744 B | SEO + Open Graph |
| `disqus.html` | 706 B | Commentaires Disqus |
| `analytics.html` | 376 B | Google Analytics |
| `search.html` | 633 B | Google Custom Search |
| `post-aside.html` | 929 B | Sidebar (TOC + partage) |
| `language-selector.html` | 474 B | Sélecteur FR/EN |
| `mermaid.html` | 128 B | Loader Mermaid |
| `asciinema.html` | 93 B | Player terminal |
| `svg-icons.html` | 2.1 KB | Icônes sociales/footer |

---

## 3. Architecture

### 3.1 Structure répertoires

```
fxrobin.github.io/
├── _posts/
│   ├── articles/           23 posts (sous-dossiers par slug)
│   ├── blanka-cave/fr/     10 posts
│   └── retro-prog/         11 posts
├── _drafts/                9 .md + 7 répertoires en cours
├── _layouts/               7 templates
├── _includes/              25 composants
├── _sass/                  26 modules SCSS
├── images/                 19 sous-répertoires (logos, flags, par-article)
├── js/                     2 fichiers JS
├── fonts/                  614 KB (polices custom)
├── asciinema/              621 KB (player + casts)
├── casts/                  54 KB (enregistrements terminal)
├── _config.yml
├── style.scss
├── index.html / index-fr.html / index-en.html
└── .github/workflows/jekyll.yml
```

### 3.2 Convention de nommage des posts

```
_posts/[catégorie]/[slug optionnel]/YYYY-MM-DD-[slug].md
```

Exemples :
- `_posts/articles/api-preconditions/2018-06-02-api-preconditions.md`
- `_posts/blanka-cave/fr/2018-07-21-Web-Components.md`
- `_posts/retro-prog/m68k-cross-compiling/2021-02-05-m68k-cross-compiling-EN.md`

### 3.3 Système multilingue

- Champ `lang: fr|en` dans le front matter
- Champ `ref` partagé entre les versions d'un même article
- `language-selector.html` retrouve la version alternate via `ref`
- Labels UI (menus, textes) définis dans `_config.yml` sous `site.t[lang].*`
- Blanka Cave : uniquement FR, pas de `ref`

### 3.4 Stratégie permalink

- Par défaut : `/:title/`
- Surcharge possible via `permalink:` dans le front matter (ex. anglais vs français)
- Redirections legacy : `redirect_from:` géré par `jekyll-redirect-from`

---

## 4. SEO et Intégrations tierces

### 4.1 SEO

| Élément | Présence | Statut |
|---------|----------|--------|
| sitemap.xml | ✓ auto via plugin | OK |
| Open Graph (og:title, og:description) | ✓ | OK |
| Twitter Card | ✓ | OK |
| Google Search Console | ✓ (`googleb3f4e2521de300ce.html`) | OK |
| Viewport meta | ✓ | OK |
| Canonical URLs | Implicite | OK |
| robots.txt explicite | ✗ | Manquant |
| JSON-LD / Schema.org | ✗ | Absent |
| Sitemap dans `<head>` | ✗ | Non lié |

### 4.2 Intégrations actives

| Service | Config | Statut |
|---------|--------|--------|
| Disqus | shortname: `fxrobin-github-io` | ✓ Actif |
| Google Analytics | UA-114271874-1 | ✓ Actif (Universal — obsolète) |
| Google Custom Search | cx=011993730579911903160:17ronej8jdw | ✓ Actif |
| Mermaid.js | opt-in via `page.mermaid: true` | ✓ Disponible, **0 posts l'utilisent** |
| Asciinema | opt-in via include | ✓ Disponible, **0 posts l'utilisent** |

---

## 5. Qualité et Problèmes Détectés

### 5.1 Problème critique — Logos manquants

**21 fichiers logo référencés dans le front matter mais absents de `/images/logos/`.**

Impact : 48% des posts affichent une image cassée.  
Exemples : `api-preconditions.png`, `archiva-rpi.png`, `code.png` (mais `code.jpg` existe).

**Action : Audit exhaustif `images/logos/` vs tous les champs `logo:` des posts.**

### 5.2 Problèmes importants

| Problème | Impact | Recommandation |
|----------|--------|----------------|
| Gaps de publication (2 ans) | Audience / SEO | Cadence éditoriale fixe |
| Google Analytics Universal (UA) | Tracking perdu — UA retraité | Migrer vers GA4 |
| Vue.js 2.5.16 inclus sans usage visible | Poids inutile | Vérifier / supprimer |
| CSS non-minifié (`style: :expanded`) | Performance | Passer à `:compressed` |
| Couverture EN à 18% | Audience internationale | Traduire 10–15 articles clés |
| Mermaid / Asciinema inutilisés | Fonctionnalités inexploitées | Les utiliser dans les prochains articles |

### 5.3 Améliorations mineures

| Problème | Recommandation |
|----------|----------------|
| 73 tags sans casse uniforme ("java" vs "Java") | Guide de style tags |
| 25% des posts sans `<!--excerpt-->` | Ajouter sur les anciens posts clés |
| Dépendances front-end figées sur vieilles versions | Auditer + mettre à jour (FA 4→6, TypewriterJS) |
| `jekyll-feed` commenté (RSS désactivé) | Considérer activation (audience RSS) |
| Pas de `robots.txt` explicite | Créer fichier minimal |
| Pas de JSON-LD | Ajouter schema `BlogPosting` pour rich snippets |

### 5.4 Drafts — action éditoriale

| Draft | Recommandation |
|-------|----------------|
| `questions-poo.md` (13.2 KB) | Finaliser et publier |
| `virtual-threads-loom/` | Sujet très actuel (Java 21+), prioritaire |
| `uuid-versions-jmh/` | JMH = différenciateur technique, prioritaire |
| `vertx-eventbus-quarkus/` | Bon sujet Quarkus ecosystem |
| `angular8-javaee.md` | Abandonner (Angular 8 = daté) |
| `choisir-js-angular-react-vue-webcomponents.md` | Abandonner ou réécrire 2026 |
| `cdi-payara-arquillian-deltaspike.md` | Abandonner |

---

## 6. Métriques de synthèse

| Métrique | Valeur | Statut |
|----------|--------|--------|
| Posts publiés | 44 | ✓ |
| Posts FR | 36 (81%) | ✓ |
| Posts EN | 8 (18%) | ⚠ Faible |
| Paires bilingues | 8 | ✓ |
| Drafts .md | 9 | ⚠ À trier |
| Répertoires en cours | 7 | ⚠ Prioritiser |
| Front matter complet (requis) | 100% | ✓ |
| Logos référencés vs présents | 52% | ✗ Critique |
| Excerpt marqué | 75% | ✓ |
| Tags uniques | 73 | ✓ |
| Layouts | 7 | ✓ |
| Includes | 25 | ✓ |
| Modules SCSS | 26 | ✓ |
| Plugins Jekyll | 3 | ✓ |
| Intégrations tierces | 5 | ✓ |

---

## 7. Recommandations prioritaires

### Priorité 1 — Critique

1. **Réparer les logos manquants** (21 fichiers) — impact visuel direct sur 48% des posts

### Priorité 2 — Important

2. **Migrer Google Analytics UA → GA4** — UA est retraité, les données sont perdues
3. **Établir une cadence de publication** — 1 article/mois minimum pour éviter les gaps
4. **Publier les drafts prioritaires** : `virtual-threads-loom`, `uuid-versions-jmh`, `questions-poo.md`
5. **Supprimer ou mettre à jour Vue.js** — v2.5.16 inclus systématiquement, usage non vérifié

### Priorité 3 — Amélioration

6. **Activer la minification CSS** : `style: :compressed` dans `_config.yml`
7. **Ajouter `robots.txt`** explicite
8. **Ajouter JSON-LD** `BlogPosting` pour les rich snippets Google
9. **Uniformiser les tags** (casse, singulier/pluriel)
10. **Utiliser Mermaid.js et Asciinema** dans les prochains articles techniques

---

*Généré par Claude Code — avril 2026*
