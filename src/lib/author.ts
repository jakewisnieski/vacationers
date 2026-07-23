// Shared author presentation for the planning boards (ideas #26, activities #27,
// and later votes/comments): resolve a poster's display name, avatar initials,
// and a stable accent, plus whether the current member may delete their own row.
// An author-less row — an imported idea (#7) or one whose author's Member was
// removed (SetNull) — falls back to a caller-supplied neutral label + accent.
// The name/initials/palette primitives live with the dashboard view-model (#15).
import { NIGHTFALL_ACCENTS, displayName, initialsFor } from "./dashboard";

/** The author fields the boards select from Prisma — null when author-less. */
export type AuthorInput = {
  name: string | null;
  email: string;
  accentColor: string | null;
} | null;

export type AuthorPresentation = {
  /** Display name, or the caller's `absent.name` for an author-less row. */
  authorName: string;
  initials: string;
  accent: string;
  /** True only when the current member authored the row — the delete gate. */
  canDelete: boolean;
};

// Neutral (ink-dim) accent for an author-less row — there's no email seed to
// derive a stable per-author color from.
const ABSENT_ACCENT = "#9aa3c0";

/**
 * A deterministic accent slot from a seed (the author's email), so a given
 * author's rows share one color even without an explicit `accentColor`.
 */
export function accentForSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return NIGHTFALL_ACCENTS[Math.abs(hash) % NIGHTFALL_ACCENTS.length];
}

/**
 * Fold a row's author + the current member into display fields and the
 * author-only delete gate. `authorId` is passed alongside `author` because the
 * delete check keys on the id, and a row can carry an id whose Member is absent.
 */
export function presentAuthor(
  author: AuthorInput,
  authorId: string | null,
  currentMemberId: string,
  absent: { name: string; initials: string },
): AuthorPresentation {
  if (!author) {
    return {
      authorName: absent.name,
      initials: absent.initials,
      accent: ABSENT_ACCENT,
      canDelete: false,
    };
  }
  return {
    authorName: displayName(author.name, author.email),
    initials: initialsFor(author.name, author.email),
    accent: author.accentColor ?? accentForSeed(author.email),
    canDelete: authorId !== null && authorId === currentMemberId,
  };
}
