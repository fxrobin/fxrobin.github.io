---
name: gitnexus-project-rules
description: Use when editing, committing, or exploring code in the fxrobin.github.io repo — enforces mandatory GitNexus impact analysis and change detection rules
---

# GitNexus — Project Rules for fxrobin.github.io

Index: **843 symbols, 928 relationships, 14 execution flows**

> Index stale? Run `npx gitnexus analyze` first.

## Always Do

- **Before editing any symbol** — run `gitnexus_impact({target: "symbolName", direction: "upstream"})`, report blast radius to user
- **Before committing** — run `gitnexus_detect_changes()` to verify only expected symbols changed
- **HIGH or CRITICAL risk** — warn user, do not proceed without confirmation
- **Exploring unfamiliar code** — use `gitnexus_query({query: "concept"})` instead of grepping
- **Full symbol context** — use `gitnexus_context({name: "symbolName"})` for callers, callees, flows

## Never Do

- NEVER edit a symbol without running `gitnexus_impact` first
- NEVER ignore HIGH or CRITICAL risk warnings
- NEVER rename with find-and-replace — use `gitnexus_rename`
- NEVER commit without running `gitnexus_detect_changes()`

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/fxrobin.github.io/context` | Codebase overview, index freshness |
| `gitnexus://repo/fxrobin.github.io/clusters` | All functional areas |
| `gitnexus://repo/fxrobin.github.io/processes` | All execution flows |
| `gitnexus://repo/fxrobin.github.io/process/{name}` | Step-by-step execution trace |

## Skills

| Task | Skill |
|------|-------|
| How does X work? | `gitnexus-exploring` |
| What breaks if I change X? | `gitnexus-impact-analysis` |
| Why is X failing? | `gitnexus-debugging` |
| Rename / extract / refactor | `gitnexus-refactoring` |
| Tools & schema reference | `gitnexus-guide` |
| Index, status, CLI commands | `gitnexus-cli` |
