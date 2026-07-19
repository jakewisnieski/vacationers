---
name: Build ticket (slice module)
about: A self-contained work order for a build slice — carries its own acceptance scenarios and close-out
title: "type: short outcome"
labels: []
assignees: []
---

<!--
A build ticket is a self-contained work order: everything needed to build it,
prove it, and merge it lives here. Title: Conventional Commit type + short
outcome, e.g. "feat(calendar): sync agreed schedule to Google Calendar".
Add a type label. See docs/github-workflow.md and docs/build-gate.md.
-->

**Depends on:** #_ · **Milestone / slice:** _

## Outcome
<!-- What this delivers, as an outcome. One unit of work. -->

## Acceptance criteria
<!-- The technical definition of done — checkable. -->
- [ ]
- [ ]

## Grounded in
<!-- Traceability: the wayfinder decision(s) / decision-log entries this draws on. -->

## Acceptance scenarios (Claude self-verifies in Gate 0)
<!-- Runnable scenarios: exact command/click + the explicit PASS condition. -->
- **S1 <name>:** `<command/click>` — **PASS:** <what you should see>.
- **S2 <name>:** `<command/click>` — **PASS:** <…>.

## Close-out (standard runbook)
<!-- Gate 0 from docs/build-gate.md; Claude never self-merges. -->
Gate 0 (feature branch → CI green + `/code-review` clean + acceptance scenarios self-verified in the PR) → Jake's acceptance → squash-merge + delete branch. The PR carries `Closes #<this>`.
