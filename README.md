# Vacationers

A one-stop web app for a friend group to plan their annual vacation together —
posting destination ideas, collecting things to do, voting on plans, and syncing
the agreed schedule to everyone's Google Calendar.

> **Status: building v1.** Planning (the wayfinder map) is complete — see
> [`docs/v1-spec.md`](docs/v1-spec.md) for the frozen spec and
> [`docs/decision-log.md`](docs/decision-log.md) for the load-bearing calls.
> Work now runs the build loop in [`docs/github-workflow.md`](docs/github-workflow.md).

## Stack

Next.js (App Router) + TypeScript · Tailwind · Prisma on Neon Postgres · Auth.js
(Google) · deployed on Vercel. Decided in
[#8](https://github.com/jakewisnieski/vacationers/issues/8).

## Local development

```bash
npm install
cp .env.example .env      # then paste your Neon DATABASE_URL into .env
npm run dev               # http://localhost:3000
```

Useful scripts:

| Script | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run db:migrate` | Prisma migrate (dev) |

`GET /api/health` returns `{ ok: true, db: "up" }` once `DATABASE_URL` points at a
reachable database.
