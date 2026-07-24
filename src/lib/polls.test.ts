import { describe, expect, it } from "vitest";
import {
  buildPollsView,
  parsePollInput,
  type PollRow,
  POLL_QUESTION_MAX,
  POLL_OPTION_MAX,
  POLL_MAX_OPTIONS,
} from "./polls";

describe("parsePollInput", () => {
  it("accepts a question with distinct options, trimming and dropping blanks", () => {
    const result = parsePollInput({
      question: "  Which week?  ",
      options: [" Week 1 ", "Week 2", "  ", "Week 3"],
    });
    expect(result).toEqual({
      ok: true,
      value: { question: "Which week?", options: ["Week 1", "Week 2", "Week 3"] },
    });
  });

  it.each(["", "   "])("rejects a blank question %j", (question) => {
    const result = parsePollInput({ question, options: ["A", "B"] });
    expect(result.ok).toBe(false);
  });

  it("rejects fewer than two non-blank options", () => {
    const result = parsePollInput({ question: "Pick", options: ["Only one", " "] });
    expect(result.ok).toBe(false);
  });

  it("rejects duplicate options case-insensitively", () => {
    const result = parsePollInput({
      question: "Pick",
      options: ["Week 1", "week 1"],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects more than the max options", () => {
    const result = parsePollInput({
      question: "Pick",
      options: Array.from({ length: POLL_MAX_OPTIONS + 1 }, (_, i) => `Opt ${i}`),
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an over-long question", () => {
    const result = parsePollInput({
      question: "x".repeat(POLL_QUESTION_MAX + 1),
      options: ["A", "B"],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an over-long option", () => {
    const result = parsePollInput({
      question: "Pick",
      options: ["A", "x".repeat(POLL_OPTION_MAX + 1)],
    });
    expect(result.ok).toBe(false);
  });
});

describe("buildPollsView", () => {
  const me = "member-1";
  const owner = "owner-1";

  // A poll authored by me: 3 options, 4 total votes, my vote on option "o2".
  const rows: PollRow[] = [
    {
      id: "p1",
      question: "Which week?",
      closedAt: null,
      authorId: me,
      author: { name: "Jake", email: "jake@example.com", accentColor: "#38bdf8" },
      createdAt: new Date("2026-07-24T10:00:00Z"),
      // Deliberately out of position order to prove the view sorts by position.
      options: [
        { id: "o2", label: "Week 2", position: 1, _count: { votes: 3 } },
        { id: "o1", label: "Week 1", position: 0, _count: { votes: 1 } },
        { id: "o3", label: "Week 3", position: 2, _count: { votes: 0 } },
      ],
      _count: { votes: 4 },
      votes: [{ optionId: "o2" }],
    },
    {
      id: "p2",
      question: "Which rental?",
      closedAt: new Date("2026-07-24T12:00:00Z"),
      authorId: "member-2",
      author: { name: null, email: "amy@example.com", accentColor: null },
      createdAt: new Date("2026-07-23T10:00:00Z"),
      options: [
        { id: "r1", label: "Cabin", position: 0, _count: { votes: 0 } },
        { id: "r2", label: "Condo", position: 1, _count: { votes: 0 } },
      ],
      _count: { votes: 0 },
      votes: [],
    },
  ];

  it("orders options by position regardless of query order", () => {
    const [poll] = buildPollsView(rows, me, false);
    expect(poll.options.map((o) => o.label)).toEqual(["Week 1", "Week 2", "Week 3"]);
  });

  it("computes each option's count and rounded vote share", () => {
    const [poll] = buildPollsView(rows, me, false);
    const [w1, w2, w3] = poll.options;
    expect([w1.voteCount, w2.voteCount, w3.voteCount]).toEqual([1, 3, 0]);
    expect([w1.percent, w2.percent, w3.percent]).toEqual([25, 75, 0]);
  });

  it("marks the current member's own choice and voted state", () => {
    const [poll] = buildPollsView(rows, me, false);
    expect(poll.hasVoted).toBe(true);
    expect(poll.options.find((o) => o.isMyVote)?.label).toBe("Week 2");
  });

  it("reports zero percent for every option when no votes are cast", () => {
    const [, closed] = buildPollsView(rows, me, false);
    expect(closed.totalVotes).toBe(0);
    expect(closed.hasVoted).toBe(false);
    expect(closed.options.every((o) => o.percent === 0)).toBe(true);
  });

  it("lets the author close an open poll, but not once it's closed", () => {
    const [mineOpen, theirsClosed] = buildPollsView(rows, me, false);
    expect(mineOpen.canClose).toBe(true);
    expect(mineOpen.isClosed).toBe(false);
    // p2 is authored by member-2 and already closed → not closable by me.
    expect(theirsClosed.canClose).toBe(false);
    expect(theirsClosed.isClosed).toBe(true);
  });

  it("lets the owner close any open poll they didn't author", () => {
    // Owner viewing p1 (authored by me, still open) may close it.
    const [poll] = buildPollsView(rows, owner, true);
    expect(poll.canClose).toBe(true);
  });

  it("never lets even the owner close an already-closed poll", () => {
    const [, closed] = buildPollsView(rows, owner, true);
    expect(closed.canClose).toBe(false);
  });

  it("labels an author-less (removed member) poll as Someone", () => {
    const orphan: PollRow = { ...rows[1], authorId: null, author: null };
    const [poll] = buildPollsView([orphan], me, false);
    expect(poll.authorName).toBe("Someone");
    expect(poll.canClose).toBe(false); // closed + no author
  });
});
