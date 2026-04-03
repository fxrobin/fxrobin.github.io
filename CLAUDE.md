# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

Personal tech blog at https://www.fxjavadevblog.fr — built with Jekyll. Topics: Java, APIs, Linux, retro computing.

## Build & Serve

There is no Gemfile. The site is built using Docker:

```bash
# Build (as CI does)
docker run -v $(pwd):/srv/jekyll -v $(pwd)/_site:/srv/jekyll/_site \
  jekyll/builder:latest /bin/bash -c "chmod 777 /srv/jekyll && jekyll build --future"

# Local serve with live reload
docker run --rm -p 4000:4000 -v $(pwd):/srv/jekyll \
  jekyll/builder:latest jekyll serve --future --livereload
```

CI runs on push/PR to `master` via `.github/workflows/jekyll.yml`.

## Architecture

### Multilingual System

Every post has a `lang` field (`fr` or `en`) and a `ref` field. Posts sharing the same `ref` are language variants of each other. The `language-selector.html` include uses `ref` to find and link alternate-language versions.

UI strings (menus, labels) are defined per-language in `_config.yml` under `site.t[lang].*`.

### Post Front Matter

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

Place `<!--excerpt-->` where the article list excerpt should end.

### Content Organization

- `_posts/articles/` — Java/tech articles (each in its own subfolder)
- `_posts/retro-prog/` — Retro computing (m68k, 6809, Atari ST)
- `_posts/blanka-cave/` — Opinion/rant posts ("Blanka's Cave")
- `_drafts/` — Work in progress. See `_drafts/PLAN.md` for the editorial plan: what's being written, what's paused, and what's been dropped.

### Layouts & Includes

- `default.html` — Shell: header, nav, footer, JS (TypewriterJS, Vue.js, axios, asciinema, mermaid)
- `post.html` — Article layout: logo, title, subtitle, date, language selector, aside (TOC + share), Disqus
- `blog_index.html` — Paginated article list
- `page-no-aside.html` — Full-width page (no sidebar)

### Styling

`style.scss` imports all partials from `_sass/`. Key files:
- `_variables.scss` — Colors, fonts (custom: `amiga`, `atari`, `volter`, `coders-crux`, `Monda`)
- `_post.scss` — Article content styles
- `_fonts.scss` — Custom font declarations

The site has a retro/hacker aesthetic (scanline header background, green-on-dark site name, pixel fonts).
