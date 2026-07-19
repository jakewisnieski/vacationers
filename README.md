# Vacationers

A one-stop web app for a friend group to plan their annual vacation together —
posting destination ideas, collecting things to do, voting on plans, and syncing
the agreed schedule to everyone's Google Calendar.

> **Status: planning.** This repo is currently being *wayfound* — the feature set,
> data model, and key technical decisions are being charted as a map of decision
> tickets in GitHub Issues before any code is written. See the issue labelled
> `wayfinder:map` for the live plan.

## How the planning is organized

- The **map** is a single GitHub Issue (label `wayfinder:map`) — the low-resolution
  view of the whole effort: the destination, decisions made so far, and the fog
  of what's still to be figured out.
- Each **decision** is a child issue (a GitHub sub-issue) that gets resolved one
  at a time, then closed with its answer recorded on the map.

Once the map is clear, building begins.
