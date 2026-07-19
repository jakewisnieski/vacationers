# How we work — the GitHub / SDLC workflow

This is Vacationers' **process contract**: how one unit of work travels from idea to shipped, and which GitHub feature carries it at each step. It exists so that every change is **deliberate, reviewable, and reversible** — and so a reviewer can see the product was shipped *by process, not by luck*. (Adapted from the same contract used on Jake's **Revivify** and **Lucid** projects.)

> **One-line version:** Jake owns the **intent** and the **gates** — what the work is, when it's good enough, whether it merges. Claude runs the **git mechanics** — branches, commits, PRs. Nothing reaches `main` except through a passing, reviewed Pull Request.

---

## The mental model

- **Version control** — every change is a labeled save point you can inspect, undo, or branch from. Nothing is ever truly lost.
- **SDLC** — the repeating loop of **plan → design → build → test → release → maintain.** GitHub has a native feature for each phase, so "following the SDLC" mostly means **using the right GitHub feature at the right moment** instead of committing code in a pile.

## Roles — who does what

| | **Jake — the gatekeeper** | **Claude — the mechanic** |
|---|---|---|
| Owns | Intent, scope, "is it good enough," the merge decision | Branch/commit/PR commands, writing the code, self-review |
| Does | Writes issues as outcomes, defines "done," reviews & approves, cuts releases | Creates the branch, commits in small steps, opens the PR, runs the checks |
| Never | Has to type git commands | Merges to `main` or pushes a release **without Jake's explicit go-ahead** |

**The load-bearing rule:** Claude must **explain what it's about to do to anything on `main`** *before* doing it, and never merge or tag a release on its own initiative.

## How SDLC phases map to GitHub

| SDLC phase | GitHub feature | What happens |
|---|---|---|
| **Plan / requirements** | **Issues** + **Projects** board | One issue per unit of work, written as an outcome |
| **Group into releases** | **Milestones** | Bundle issues into slices / milestones |
| **Design** | Issue description / docs in-repo | Capture the approach *before* building |
| **Build** | **Branch** + **Commits** | Isolated work; small, labeled save points |
| **Test / review** | **Pull Request** + **Actions (CI)** + review gate | The quality gate before anything reaches `main` |
| **Release** | **Merge** + **Tag** + **Release** | Mark a shippable version |
| **Maintain** | **Issues** (bugs) → repeat the loop | Every bug re-enters as a new issue |

---

## Planning first — the wayfinder phase

Before the build loop runs, Vacationers' product decisions are charted as a **wayfinder map** on **GitHub Issues**: a single issue labelled `wayfinder:map`, with child decision **tickets** (`wayfinder:research` / `prototype` / `grilling` / `task`). These resolve *decisions*, not code — so no branches or PRs during planning. Every resolved decision is gisted into the map and, for the load-bearing calls, into [`decision-log.md`](decision-log.md). The build loop below begins once the map hands off a build-ready slice.

---

## One-time project setup

Status for **this** repo (`github.com/jakewisnieski/vacationers`):

| # | Item | Why | Status |
|---|---|---|---|
| 1 | **README** — what it is, current status | The front door reviewers see | ✅ Done |
| 2 | **`.gitignore`** covers secrets & build junk | Avoid committing API keys / build output | ✅ Done — `.env*`, `node_modules/`, `dist/`, etc. |
| 3 | **Branch protection on `main`** (a ruleset): require a PR, block force-push & deletion, no bypass | Forces the SDLC gate — no accidental dumps onto `main` | ✅ Done — turned on while `main` was a clean scaffold |
| 4 | **Project board** (Todo / In Progress / Review / Done) linked to the repo | Makes the plan visible | ⬜ Optional / later |
| 5 | **Issue templates** (`.github/ISSUE_TEMPLATE/`) — Feature + Bug + Build ticket | Every issue is structured | ✅ Done |
| 6 | **CI workflow** (`.github/workflows/ci.yml`) — lint · typecheck · test · build on every PR | Red = don't merge; the automated half of the gate | ⬜ **Deferred until the stack is chosen** (nothing to lint/test/build yet) |

> ### ⚑ Step 0 — branch protection is on *before* the first feature branch
> Branch protection is the one switch that makes this workflow *real* rather than cosmetic: with it on, the **only** way onto `main` is a passing, reviewed PR. It was turned on while `main` was a clean scaffold — the easiest possible moment. The bootstrap scaffolding (README, `.gitignore`, these docs, issue templates) was committed directly to `main` *before* protection went on; every feature from here runs the full loop.

---

## The core loop — repeat for every piece of work

One trip through the loop = **one feature or fix.**

### 1. Create an Issue (Plan)
Describe the work as an **outcome**: *"As a user I can X so that Y,"* plus **acceptance criteria**. Assign it to a **Milestone**. This is the requirement of record.

### 2. Branch off `main` (isolate)
**One branch per issue**, named by type and topic: `feat/destination-ideas`, `fix/vote-tally`, `docs/decision-log`. `main` stays clean and always-shippable.

### 3. Commit in small, labeled steps (Build)
Each commit = one coherent change with a clear message. **Prefer many small commits over one giant one.** Use [Conventional Commits](#conventional-commits) prefixes.

### 4. Open a Pull Request (Test + review gate)
When the branch is ready, open a PR back to `main`. The description says **what changed** and **links the issue** — `Closes #12`. Gates:

- **Automated checks (GitHub Actions)** — lint, typecheck, test, and build on every PR. **Red = don't merge.** (Live once CI is enabled with the stack.)
- **Code review** — Claude self-reviews the diff (`/code-review`); deeper passes when we want them.
- **Jake's acceptance test** — Jake runs the app and verifies the slice **as the end user**.

The concrete per-slice build gate is in [`build-gate.md`](build-gate.md).

### 5. Merge (Integrate)
Once checks are green and Jake has accepted it: **Squash merge**, then **delete the branch**. The issue closes itself.

### 6. Tag a release at milestone boundaries (Release)
When a slice's issues are all merged, cut a **Release** with a version tag → [Versioning](#versioning--releases).

### 7. Maintain
Every bug found later becomes a **new Issue**, and we re-enter the loop at step 1.

---

## Conventional commits

| Prefix | For |
|---|---|
| `feat:` | a new capability |
| `fix:` | a bug fix |
| `docs:` | documentation |
| `test:` | tests |
| `refactor:` | restructuring, no behavior change |
| `chore:` | tooling / config |

## Versioning & releases

**Semantic Versioning — `MAJOR.MINOR.PATCH`:**

- **PATCH** (`0.1.1`) — bug fixes only
- **MINOR** (`0.2.0`) — new features, nothing broken
- **MAJOR** (`1.0.0`) — breaking changes / first real launch

The slice → version plan will be set once the map hands off the first build slice.

---

## Non-dev guardrails (the short list)

- **You are the gatekeeper, not the mechanic.** Write clear issues, define "done," approve merges. Let Claude run the git commands — but make it explain anything that touches `main` first.
- **Never commit secrets.** `.gitignore` covers `.env*` — verify it still does before trusting it.
- **`main` is sacred.** With protection on, the only path onto `main` is a passing, reviewed PR.
- **Small PRs are safer.** If an issue feels big, split it.
- **The audit trail is a deliverable.** Issue → PR → review → merge → tagged release is itself the artifact: it shows the product was shipped deliberately.
