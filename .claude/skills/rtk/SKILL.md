---
name: rtk
description: Use when running shell commands in Claude Code — always prefix with rtk for 60-90% token savings on git, build, test, search, and infra commands
---

# RTK — Rust Token Killer

Token-optimized CLI proxy. Always prefix commands with `rtk`. Unknown commands pass through unchanged.

**Golden rule:** `rtk <cmd>` everywhere, including `&&` chains.

## Quick Reference

| Category | Commands | Savings |
|----------|----------|---------|
| Tests | `rtk vitest run`, `rtk playwright test`, `rtk cargo test` | 90–99% |
| Build | `rtk next build`, `rtk tsc`, `rtk lint`, `rtk prettier --check` | 70–87% |
| Git | `rtk git status/log/diff/add/commit/push/pull/branch/…` | 59–80% |
| GitHub | `rtk gh pr view`, `rtk gh run list`, `rtk gh issue list` | 26–87% |
| Packages | `rtk pnpm install/list/outdated`, `rtk npm run`, `rtk npx` | 70–90% |
| Files | `rtk ls`, `rtk read`, `rtk grep`, `rtk find` | 60–75% |
| Infra | `rtk docker ps/images/logs`, `rtk kubectl get/logs` | 85% |
| Network | `rtk curl`, `rtk wget` | 65–70% |
| Analysis | `rtk err <cmd>`, `rtk log <file>`, `rtk summary <cmd>` | 70–90% |

## Command Chains

```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## Meta Commands

```bash
rtk gain              # Token savings analytics
rtk gain --history    # Command history with savings
rtk discover          # Find missed RTK opportunities in Claude history
rtk proxy <cmd>       # Raw passthrough (debug only)
```

## Common Mistakes

- Forgetting `rtk` on second command in a chain
- Using bare `git` / `npm` / `docker` — always use `rtk`
- Using `rtk proxy` in normal work (debug only)
