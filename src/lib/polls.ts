// Pure polls helpers — no I/O, so the create-poll validation and the board
// view-model unit-test without a database (#29). The /polls screen and its
// server actions build on these. Author display/initials/accent come from
// ./author, shared with the ideas (#26) and activities (#27) boards.

import { presentAuthor, type AuthorInput } from "./author";

export const POLL_QUESTION_MAX = 200;
export const POLL_OPTION_MAX = 100;
// A poll needs a real choice (2+), and a short ballot keeps the single-choice UI
// legible — beyond a handful of options a poll wants a different tool.
export const POLL_MIN_OPTIONS = 2;
export const POLL_MAX_OPTIONS = 8;

/** Result of the create-poll action, surfaced inline on the form. */
export type CreatePollResult = { ok: true } | { ok: false; error: string };

/** Cleaned, storage-ready poll fields: a question + its ordered option labels. */
export type ParsedPoll = {
  question: string;
  options: string[];
};

/**
 * Validate + normalize the create-poll form fields. The question is required;
 * blank options are dropped; what remains must be 2–8 distinct labels (compared
 * case-insensitively so "Week 1" and "week 1" aren't offered as two choices).
 * Order is preserved — the ballot renders in the order the author typed.
 */
export function parsePollInput(raw: {
  question: string;
  options: string[];
}): { ok: true; value: ParsedPoll } | { ok: false; error: string } {
  const question = raw.question.trim();
  if (!question) return { ok: false, error: "Ask a question for the poll." };
  if (question.length > POLL_QUESTION_MAX) {
    return {
      ok: false,
      error: `Keep the question under ${POLL_QUESTION_MAX} characters.`,
    };
  }

  const options: string[] = [];
  const seen = new Set<string>();
  for (const raw_option of raw.options) {
    const option = raw_option.trim();
    if (!option) continue; // a left-blank option input is simply skipped
    if (option.length > POLL_OPTION_MAX) {
      return {
        ok: false,
        error: `Keep each option under ${POLL_OPTION_MAX} characters.`,
      };
    }
    const key = option.toLowerCase();
    if (seen.has(key)) {
      return { ok: false, error: "Give each option a different label." };
    }
    seen.add(key);
    options.push(option);
  }

  if (options.length < POLL_MIN_OPTIONS) {
    return {
      ok: false,
      error: `Offer at least ${POLL_MIN_OPTIONS} options to vote between.`,
    };
  }
  if (options.length > POLL_MAX_OPTIONS) {
    return {
      ok: false,
      error: `A poll can have at most ${POLL_MAX_OPTIONS} options.`,
    };
  }

  return { ok: true, value: { question, options } };
}

/**
 * The raw shape the page pulls from Prisma. `_count.votes` is the poll's total;
 * each option carries its own `_count.votes`; `votes` is scoped to the current
 * member (their one row or nothing — the "what did I pick?" signal), never the
 * whole ballot's votes.
 */
export type PollRow = {
  id: string;
  question: string;
  closedAt: Date | null;
  authorId: string | null;
  author: AuthorInput;
  createdAt: Date;
  options: {
    id: string;
    label: string;
    position: number;
    _count: { votes: number };
  }[];
  _count: { votes: number };
  votes: { optionId: string }[];
};

export type PollOptionCard = {
  id: string;
  label: string;
  voteCount: number;
  /** Share of the poll's votes, 0–100 (rounded); 0 while no votes are cast. */
  percent: number;
  /** True when this option is the current member's current choice. */
  isMyVote: boolean;
};

export type PollCard = {
  id: string;
  question: string;
  /** Author display name, or "Someone" for an author-less (removed member) poll. */
  authorName: string;
  initials: string;
  accent: string;
  /** True once the poll is closed — it shows results but takes no new votes. */
  isClosed: boolean;
  /** True when the current member may close it: its author or the group owner. */
  canClose: boolean;
  totalVotes: number;
  /** True when the current member has cast a vote on this poll. */
  hasVoted: boolean;
  options: PollOptionCard[];
};

/**
 * Fold Poll rows (already ordered by the query) into board card view-models:
 * author identity (a removed creator shows as "Someone"), each option's count +
 * share, which option is the member's own pick, and whether they may close it —
 * the author or the group owner, and only while it's still open (#29).
 */
export function buildPollsView(
  rows: PollRow[],
  currentMemberId: string,
  isOwner: boolean,
): PollCard[] {
  return rows.map((row) => {
    const { authorName, initials, accent, canDelete: isAuthor } = presentAuthor(
      row.author,
      row.authorId,
      currentMemberId,
      { name: "Someone", initials: "?" },
    );
    const isClosed = row.closedAt !== null;
    const totalVotes = row._count.votes;
    const myOptionId = row.votes[0]?.optionId ?? null;

    const options = [...row.options]
      // Stable ballot order — the author's input order (mirrors the DB query,
      // but re-sort here so the view-model never depends on the query's order).
      .sort((a, b) => a.position - b.position)
      .map((option) => ({
        id: option.id,
        label: option.label,
        voteCount: option._count.votes,
        percent:
          totalVotes === 0
            ? 0
            : Math.round((option._count.votes / totalVotes) * 100),
        isMyVote: option.id === myOptionId,
      }));

    return {
      id: row.id,
      question: row.question,
      authorName,
      initials,
      accent,
      isClosed,
      // A closed poll can't be closed again; otherwise its author or the owner may.
      canClose: !isClosed && (isAuthor || isOwner),
      totalVotes,
      hasVoted: myOptionId !== null,
      options,
    };
  });
}
