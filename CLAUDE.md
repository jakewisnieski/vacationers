# Working on Vacationers — operating rules for Claude

Full process contract: **[`docs/github-workflow.md`](docs/github-workflow.md)**. This file is the short, always-loaded version so the workflow actually sticks each session. (The SDLC / GitHub workflow is mirrored from Jake's **Revivify** and **Lucid** projects.)

Vacationers is a one-stop web app for a friend group to plan their annual vacation together: posting destination ideas, collecting things to do, voting/discussing plans, and syncing the agreed schedule to everyone's Google Calendar.

## Roles
- **Jake owns intent + gates:** what the work is, when it's good enough, whether it merges.
- **Claude runs the mechanics:** branches, commits, PRs, self-review — but **never merges to `main` or tags a release without Jake's explicit go-ahead**, and **explains anything that touches `main` before doing it.**

## The default loop for any non-trivial work
1. **Issue** — the work as an outcome + acceptance criteria, assigned to a Milestone.
2. **Branch off `main`** — one branch per issue: `feat/…`, `fix/…`, `docs/…`, `refactor/…`, `chore/…`. Never commit straight to `main`.
3. **Small commits** — one coherent change each, [Conventional Commits](docs/github-workflow.md#conventional-commits) prefix (`feat/fix/docs/test/refactor/chore`). Prefer many small over one giant.
4. **Pull Request → `main`** — description says what changed + `Closes #<n>`. Gates: CI green, Claude self-review (`/code-review`), Jake's end-user acceptance.
5. **Squash-merge on Jake's approval**, delete the branch.
6. **Tag a release at milestone boundaries** — SemVer (`v0.1.0` = first slice). Only on Jake's go-ahead.

## Non-negotiables
- **`main` is sacred** — the only path onto it is a passing, reviewed PR. Branch protection is **on** (active ruleset, no bypass).
- **Never commit secrets.** If a `.env` or key is about to be staged, stop. `.gitignore` covers `.env*` — verify before trusting.
- **Small PRs over big ones.** If an issue feels big, split it.
- **Commit/push only when asked.** Don't push, open PRs, or merge on your own initiative.

## Planning happens on the issue tracker (wayfinder)
Product decisions are charted as a **wayfinder map** and decision tickets on **GitHub Issues** (labels `wayfinder:*`) — these are *decisions*, not code, so the build loop above doesn't fire during planning. The build loop fires once we start building what the map decided. The *why* behind big calls lands in [`docs/decision-log.md`](docs/decision-log.md).

## Current state (2026-07-19)
**Wayfinding the v1 spec.** The destination of the current planning effort (the "lighter" framing) is to decide the **v1 feature set** and the **tech stack / big technical calls** (Google Calendar hookup, how friends log in, hosting). The overarching project goal beyond that is an **MVP Jake and his friends can log into** (multi-user). No application code or stack chosen yet, so **CI (`.github/workflows/ci.yml`) is deferred** until the stack decision lands (mirroring how Lucid deferred CI to its M1).
