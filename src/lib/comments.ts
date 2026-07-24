// Pure comment helpers — no I/O, so add-comment validation and the thread
// view-model unit-test without a database (#30). The comment thread + its server
// actions build on these. Author display/initials/accent + the delete gate come
// from ./author, shared with the ideas (#26), activities (#27), and polls (#29)
// boards. The model is polymorphic (a comment targets an idea, activity, or
// poll); this slice wires only ideas in the UI.

import { presentAuthor, type AuthorInput } from "./author";

// Roomy enough for a real discussion post, capped so a member can't store an
// unbounded body. The comment body is the one free-text field here.
export const COMMENT_BODY_MAX = 2000;

/** What a comment attaches to. Mirrors the Prisma `CommentTarget` enum, but kept
 * as a plain string union here so this module (and the thread components) stay
 * free of a Prisma import. */
export type CommentTargetType = "idea" | "activity" | "poll";

/** Result of the add-comment action, surfaced inline on the form. */
export type AddCommentResult = { ok: true } | { ok: false; error: string };

/** Cleaned, storage-ready comment fields. */
export type ParsedComment = {
  body: string;
};

/**
 * Validate + normalize the add-comment body. Required; trimmed; capped at
 * `COMMENT_BODY_MAX`.
 */
export function parseCommentInput(raw: {
  body: string;
}): { ok: true; value: ParsedComment } | { ok: false; error: string } {
  const body = raw.body.trim();
  if (!body) return { ok: false, error: "Write a comment first." };
  if (body.length > COMMENT_BODY_MAX) {
    return {
      ok: false,
      error: `Keep the comment under ${COMMENT_BODY_MAX} characters.`,
    };
  }
  return { ok: true, value: { body } };
}

/** The raw shape the thread pulls from Prisma — the fields a comment needs. */
export type CommentRow = {
  id: string;
  body: string;
  authorId: string | null;
  author: AuthorInput;
};

export type CommentCard = {
  id: string;
  body: string;
  /** Author display name, or "Someone" for an author-less (removed member) comment. */
  authorName: string;
  initials: string;
  accent: string;
  /** True when the current member authored it — only then may they delete it. */
  canDelete: boolean;
};

/**
 * Fold Comment rows (already ordered chronologically by the query) into thread
 * card view-models, resolving author identity (a removed poster shows as
 * "Someone"), a stable accent, and whether the current member may delete each
 * comment (author-only, #30).
 */
export function buildCommentsView(
  rows: CommentRow[],
  currentMemberId: string,
): CommentCard[] {
  return rows.map((row) => {
    const author = presentAuthor(row.author, row.authorId, currentMemberId, {
      name: "Someone",
      initials: "?",
    });
    return {
      id: row.id,
      body: row.body,
      ...author,
    };
  });
}
