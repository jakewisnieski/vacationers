# Decision log

The *why* behind Vacationers' load-bearing decisions. Product decisions are charted in detail on the [wayfinder map](https://github.com/jakewisnieski/vacationers/issues?q=label%3Awayfinder%3Amap); this log records the ones worth reading in one place. Newest last.

---

### 1. Adopt the full SDLC / GitHub workflow from day one
Every change reaches `main` only through a passing, reviewed PR; branch protection was turned on while `main` was a clean scaffold. The workflow is mirrored from Jake's Revivify and Lucid projects. **Why:** the process is easiest to make real on an empty repo, Jake wants consistency across his projects, and the audit trail (issue → PR → review → merge) is itself a deliverable. See [`github-workflow.md`](github-workflow.md).

### 2. Plan on a wayfinder map (GitHub Issues), not straight into code
Product decisions are charted as a `wayfinder:map` issue with child decision tickets, worked one at a time. **Why:** the idea is large and foggy; deciding before building keeps the first slice honest and the reasoning inspectable.
