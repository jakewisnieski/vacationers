# The build gate — how each slice of work ships

This is the **build-phase companion** to [`github-workflow.md`](github-workflow.md). That doc says every change reaches `main` only through a passing, reviewed PR; this one says *how* each build slice runs that gate — the automated pass and the human acceptance step — so "done" always means the same thing. (Adapted from the same gate used on Revivify and Lucid.)

> **One-line version:** every unit of work closes out through **two gates** — an automated pass (Gate 0) and Jake's hands-on acceptance (Gate 1) — and Claude never self-merges.

---

## The two gates

**Gate 0 — automated.** After the work is committed on a feature branch off `main`, Claude runs the automated pass: **review → test → lint → typecheck → build → push → PR → CI**. It validates committed history, opens the PR, and reports green when CI passes — **it never merges**. This is the automated half of the review gate from `github-workflow.md` §4 (CI checks + `/code-review` self-review + PR open). On Vacationers this can be a `/code-review` pass plus CI, or the fuller `/no-mistakes` pipeline once it's wired up.

**Gate 1 — human acceptance (Jake).** Once Gate 0 is green, Jake runs the issue's **acceptance criteria** as the end user. On all-PASS he approves; Claude then **squash-merges and deletes the branch**.

Neither gate is skippable, and the order is fixed: **Gate 0 green → Gate 1 pass → merge.**

---

## What every build issue contains

- **Outcome** — what the slice delivers, as an outcome.
- **Acceptance criteria** — the checkable definition of done.
- **Grounded in** — the wayfinder decision(s) / decision-log entries it draws on.
- **Acceptance walkthrough** — Jake's scenarios: exact command/click + the explicit PASS condition.
- **Close-out** — the two-gate sequence above.

---

> **Not yet active.** Vacationers is in the wayfinder (planning) phase — there are no build slices yet, and CI is deferred until the stack is chosen. The concrete per-slice specifics (intent model, CI checks, acceptance walkthroughs) get filled in when the map hands off the first build slice.
