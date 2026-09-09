---
name: fxjavadevblog-architecture
description: Use when navigating, editing, or creating files in the fxjavadevblog Jekyll site — layouts, includes, styles, multilingual system, post structure, or content organization
---

# fxjavadevblog Architecture

## Multilingual System

Each post has `lang` field (`fr` or `en`) and `ref` field. Posts sharing same `ref` = language variants. `language-selector.html` uses `ref` to find + link alternate versions.

UI strings (menus, labels) defined per-language in `_config.yml` under `site.t[lang].*`.

## Post Front Matter

```yaml
---
layout: post
title: "..."
subtitle: "..."
logo: filename.png        # from /images/logos/
category: articles        # or retro-prog, blanka-cave
tags: [tag1, tag2]
lang: fr                  # or en
ref: unique-post-ref      # shared across language variants
permalink: /my-post/
redirect_from:
  - /old-url
mermaid: true             # optional — loads mermaid.js
---
```

Place `<!--excerpt-->` where article list excerpt should end.

## Content Organization

| Path | Purpose |
|------|---------|
| `_posts/articles/` | Java/tech articles (each in own subfolder) |
| `_posts/retro-prog/` | Retro computing (m68k, 6809, Atari ST) |
| `_posts/blanka-cave/` | Opinion/rant posts ("Blanka's Cave") |
| `_drafts/` | Work in progress — see `_drafts/PLAN.md` for editorial plan |

**Post file naming:** `_posts/<category>/<slug>/YYYY-MM-DD-<slug>-<lang>.md`  
Example: `_posts/articles/eclipse-collections/2026-04-03-eclipse-collections-fr.md`

`--future` flag in build/serve publishes posts with future `date:`. Without it, future-dated posts skipped.

## Layouts & Includes

| File | Role |
|------|------|
| `default.html` | Shell: header, nav, footer, JS (TypewriterJS, Vue.js, axios, asciinema, mermaid) |
| `post.html` | Article layout: logo, title, subtitle, date, language selector, aside (TOC + share), Disqus |
| `blog_index.html` | Paginated article list |
| `page-no-aside.html` | Full-width page (no sidebar) |

## Styling

`style.scss` imports all partials from `_sass/`. Key files:

| File | Purpose |
|------|---------|
| `_variables.scss` | Colors, fonts (custom: `amiga`, `atari`, `volter`, `coders-crux`, `Monda`) |
| `_post.scss` | Article content styles |
| `_fonts.scss` | Custom font declarations |

## Article Writing

Use `fxjavadevblog-article-writing` skill when creating or editing posts — covers structure, tone, typography, anti-AI-tic patterns.
