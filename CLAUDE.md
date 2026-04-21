# CLAUDE.md

Guidance for Claude Code (claude.ai/code) in this repository.

## About

Personal tech blog at https://www.fxjavadevblog.fr — Jekyll. Topics: Java, APIs, Linux, retro computing.

## Build & Serve

No Gemfile. Site built via Docker with an existing bash script in the path.

```bash
$ jkl
```

if the script is not in path, run /_bin/jkl from the root of this repo.

CI runs on push/PR to `master` via `.github/workflows/jekyll.yml`.

## Architecture

Use `fxjavadevblog-architecture` skill for site structure, multilingual system, post front matter, layouts, includes, and styling reference.

### Article Writing

Use `fxjavadevblog-article-writing` skill when creating or editing posts.

# GitNexus — Code Intelligence

Use `gitnexus-project-rules` skill for mandatory rules, resources, and tool index.

# RTK (Rust Token Killer)

Use `rtk` skill for full command reference. Golden rule: always prefix commands with `rtk`.
