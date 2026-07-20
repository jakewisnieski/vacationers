# Decision log

The *why* behind Vacationers' load-bearing decisions. Product decisions are charted in detail on the [wayfinder map](https://github.com/jakewisnieski/vacationers/issues?q=label%3Awayfinder%3Amap); this log records the ones worth reading in one place. Newest last.

---

### 1. Adopt the full SDLC / GitHub workflow from day one
Every change reaches `main` only through a passing, reviewed PR; branch protection was turned on while `main` was a clean scaffold. The workflow is mirrored from Jake's Revivify and Lucid projects. **Why:** the process is easiest to make real on an empty repo, Jake wants consistency across his projects, and the audit trail (issue → PR → review → merge) is itself a deliverable. See [`github-workflow.md`](github-workflow.md).

### 2. Plan on a wayfinder map (GitHub Issues), not straight into code
Product decisions are charted as a `wayfinder:map` issue with child decision tickets, worked one at a time. **Why:** the idea is large and foggy; deciding before building keeps the first slice honest and the reasoning inspectable.

### 3. v1 tech stack — mirror Lucid: Next.js + TS on Vercel, Postgres/Prisma on Neon, Auth.js
The v1 stack ([#8](https://github.com/jakewisnieski/vacationers/issues/8)): **Next.js (App Router) + TypeScript** on **Vercel**; **Postgres + Prisma on Neon**; **Auth.js/NextAuth v5** (Google-only); **Vercel Blob** vault; **Resend** email; an **authenticated import endpoint** for the offline Qwen3 → prod handoff. **Why:** Lucid is the closest analog and its stack is proven for this shape; Vercel + Neon is the lowest-ops default Next.js path, and **serverless is safe here because the model seam is offline** (the app never calls the GPU at request time, [#7](https://github.com/jakewisnieski/vacationers/issues/7)). **Auth.js beat Clerk specifically** because [#5](https://github.com/jakewisnieski/vacationers/issues/5)'s DB-authoritative allowlist and [#6](https://github.com/jakewisnieski/vacationers/issues/6)'s self-stored, encrypted calendar refresh token both require identity/tokens to live in our own DB. The stack doesn't wall off the v2+ growth features (map, routing, booking). Full write-up on [#8](https://github.com/jakewisnieski/vacationers/issues/8); consolidated in [`v1-spec.md`](v1-spec.md). This closed the wayfinder map — the build phase begins here.
