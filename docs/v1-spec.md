# Vacationers — v1 spec

The build-ready specification for Vacationers v1, frozen from the **wayfinder map** ([#1](https://github.com/jakewisnieski/vacationers/issues/1), closed 2026-07-20 after 8/8 decisions resolved). This is the in-repo record of *what we decided*; the *why* behind the load-bearing calls is in [`decision-log.md`](decision-log.md), and the full reasoning for each decision lives on its closed ticket. Data-model **detail** and the per-slice build breakdown are build-phase work (the milestones below), not this document.

## North star

**A single source of truth** — one place all members see exactly where trip planning stands. The **trip dashboard** is the screen that delivers it.

## Group & trip model (the spine)

- **Group** — a **mutable, owner-managed member set** (starts at ~4, built to grow). One **owner** (Jake); everyone else is flat. Roster management is the only privileged action.
- **Trip** — a **first-class entity**: each year its own space; past trips accrue.
- **Access is group-level** — every member sees all trips, past and present.
- **Participation is per-trip** — the dashboard's "who's in." Availability / date-finding (FreeBusy) overlaps only a trip's *participants*, not the whole roster.

Detailed in [#5](https://github.com/jakewisnieski/vacationers/issues/5).

## v1 feature set (11)

Trip dashboard · destination ideas board · things-to-do / activities · voting / polls · availability & date-finding (FreeBusy) · discussion / comments · agreed schedule → Google Calendar · web idea-sourcing (Qwen3) · activity feed · shared checklist (with owners) · reservations / docs vault.

The **dashboard** is the north-star screen: the **big-three (destination · dates · who's in)** as a hero, plus a status band, needs-your-input, activity feed, and checklist progress. **Notifications = targeted email** on key events (task assigned · poll needs your vote · decision locks · @mention / reply) + the in-app feed; digests / push deferred. (From [#2](https://github.com/jakewisnieski/vacationers/issues/2).)

## Load-bearing decisions

| Area | Decision | Ticket |
|---|---|---|
| **Auth & privacy** | Google-only sign-in, **identity scopes only**; invite-only **DB-authoritative allowlist** managed via an in-app owner screen; non-members hard-bounced; fully private (no public share links). Calendar is a **separate** opt-in. | [#5](https://github.com/jakewisnieski/vacationers/issues/5) |
| **Google Calendar** | **Two-way**, **production-at-launch** OAuth (to escape Testing's ~7-day re-consent). Connect = incremental opt-in pulling `calendar.events` + `calendar.freebusy`, refresh token stored **encrypted**, primary calendar only. Date-finding = **hybrid** (FreeBusy auto-surfaces busy days; non-connectors enter availability manually; members confirm). Trip-lock pushes one all-day multi-day event per participant. | [#6](https://github.com/jakewisnieski/vacationers/issues/6) |
| **Idea-sourcing** | **Pre-generated pool**: Qwen3 runs **offline** on Jake's home GPU; a batch does web-retrieval + generation → structured ideas. The **hosted app never calls the GPU at request time**. Ideas land **owner-reviewed** (`suggested` → approve). | [#4](https://github.com/jakewisnieski/vacationers/issues/4), [#7](https://github.com/jakewisnieski/vacationers/issues/7) |
| **Visual language** | **"Wanderlust · Nightfall"** — dark navy stage, serif display headings, per-member colored avatars + presence dots, **Electric Dusk hero** (blue → indigo → pink), big-three as cards floating over the hero. [Live prototype](https://jakewisnieski.github.io/vacationers/). | [#9](https://github.com/jakewisnieski/vacationers/issues/9) |
| **Tech stack & hosting** | See the table below. | [#8](https://github.com/jakewisnieski/vacationers/issues/8) |

## Tech stack (decided in [#8](https://github.com/jakewisnieski/vacationers/issues/8) — mirrors Lucid)

| Layer | Choice | Note |
|---|---|---|
| Framework / host | **Next.js (App Router) + TypeScript** on **Vercel** | Serverless is safe because the model seam is **offline** (#7). |
| DB / ORM | **Postgres + Prisma on Neon** | Serverless PG, preview-branch DBs; Prisma migrations = audit trail. |
| Auth | **Auth.js / NextAuth v5, Google-only** | Tokens live in **our** DB — required by #5's allowlist + #6's encrypted calendar token (the reason it beat Clerk). |
| File storage | **Vercel Blob** (R2 fallback) | Reservations / docs vault: presigned, private by default. |
| Email | **Resend** | Transactional notifications (#2). |
| Background | **Vercel Cron** (digests) + route handler (Qwen3 import) | No always-on worker needed. |
| Idea import | **Authenticated import endpoint** | Home batch POSTs → rows land as `suggested`; no prod-DB exposure. |
| Secrets | Vercel env / secret store | Holds the AES-GCM key for refresh-token encryption. |

Does **not** preclude the v2+ growth features (interactive map, route optimization, centralized booking) — all additive on this stack.

## Milestone roadmap

| Milestone | Slice |
|---|---|
| **v0.1.0 — Walking skeleton** | Login (Google + allowlist) + core schema + trip dashboard shell. Proves the architecture end-to-end. |
| **v0.2.0 — Planning core** | Destination ideas board · things-to-do · voting/polls · discussion/comments. |
| **v0.3.0 — Dates & Calendar** | Availability & date-finding (FreeBusy) · agreed schedule → Google Calendar. |
| **v0.4.0 — Content & coordination** | Web idea-sourcing (Qwen3 import) · activity feed · shared checklist · reservations/docs vault. |
| **v1.0.0 — Launch** | Google OAuth production verification (verified domain + homepage + privacy policy), polish, deploy. |

## Post-v1 roadmap (ordered fast-follow)

Day-by-day itinerary → expense splitting → lodging/booking mgmt → packing lists → flight coordination → photo recap. *(Skip-for-now: weather / currency / countdown widgets.)*

## Out of scope (v2+, recorded so they're not lost)

Interactive map · route optimization · centralized booking. The stack must not wall these off — and doesn't.

## Deferred to the build phase

- **Data-model detail** — the spine is in [#12](https://github.com/jakewisnieski/vacationers/issues/12); per-feature detail lands with each slice.
- **Per-slice acceptance** — carried on each build ticket (see [`build-gate.md`](build-gate.md)).
