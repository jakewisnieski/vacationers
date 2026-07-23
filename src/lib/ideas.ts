// Pure ideas-board helpers — no I/O, so the add-idea validation and the board
// view-model can be unit-tested without a database (#26). The server actions and
// the /ideas screen build on these. URL checks come from ./url and author
// display/initials/accent + the delete gate from ./author, shared with the
// activities board (#27) and the dashboard's view-model (#15).

import { hostOf, isValidUrl } from "./url";
import { presentAuthor, type AuthorInput } from "./author";

export const IDEA_TITLE_MAX = 120;
export const IDEA_DESCRIPTION_MAX = 500;
// Well under Postgres/browser practical URL limits; caps the one otherwise
// unbounded field so a member can't post a megabyte "link".
export const IDEA_URL_MAX = 2048;

/** Result of the add-idea action, surfaced inline on the form. */
export type AddIdeaResult = { ok: true } | { ok: false; error: string };

/** Cleaned, storage-ready idea fields (optional fields collapsed to null). */
export type ParsedIdea = {
  title: string;
  description: string | null;
  url: string | null;
};

/**
 * Validate + normalize the add-idea form fields. Title is required; description
 * and link are optional; a supplied link must be a real http(s) URL. Trimmed
 * empty optionals become `null`.
 */
export function parseIdeaInput(raw: {
  title: string;
  description: string;
  url: string;
}): { ok: true; value: ParsedIdea } | { ok: false; error: string } {
  const title = raw.title.trim();
  if (!title) return { ok: false, error: "Give your idea a title." };
  if (title.length > IDEA_TITLE_MAX) {
    return {
      ok: false,
      error: `Keep the title under ${IDEA_TITLE_MAX} characters.`,
    };
  }

  const description = raw.description.trim();
  if (description.length > IDEA_DESCRIPTION_MAX) {
    return {
      ok: false,
      error: `Keep the description under ${IDEA_DESCRIPTION_MAX} characters.`,
    };
  }

  const url = raw.url.trim();
  if (url) {
    if (url.length > IDEA_URL_MAX) {
      return {
        ok: false,
        error: `Keep the link under ${IDEA_URL_MAX} characters.`,
      };
    }
    if (!isValidUrl(url)) {
      return {
        ok: false,
        error: "Enter a valid link (http:// or https://) or leave it blank.",
      };
    }
  }

  return {
    ok: true,
    value: {
      title,
      description: description || null,
      url: url || null,
    },
  };
}

/** The raw shape the page pulls from Prisma — the fields the board needs. */
export type IdeaRow = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  authorId: string | null;
  author: AuthorInput;
};

export type IdeaCard = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  /** Bare host for the link chip, e.g. "airbnb.com" — null when there's no link. */
  linkHost: string | null;
  /** Author display name, or "Suggested" for an author-less (imported) idea. */
  authorName: string;
  initials: string;
  accent: string;
  /** True when the current member authored it — only then may they delete it. */
  canDelete: boolean;
};

/**
 * Fold Idea rows (already ordered by the query) into board card view-models,
 * resolving author identity (author-less imported rows show as "Suggested"), a
 * stable accent, a link host, and — crucially — whether the current member may
 * delete each idea (author-only, #26).
 */
export function buildIdeasView(
  rows: IdeaRow[],
  currentMemberId: string,
): IdeaCard[] {
  return rows.map((row) => {
    // Re-validate at render, not just at input: any writer (a future imported
    // row, seed, a hand-edited DB value) could carry a non-http(s) URL, and we
    // never want that reaching an <a href>. Only a real web URL becomes a link.
    const safeUrl = row.url && isValidUrl(row.url) ? row.url : null;
    const author = presentAuthor(row.author, row.authorId, currentMemberId, {
      name: "Suggested",
      initials: "✦",
    });
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      url: safeUrl,
      linkHost: safeUrl ? hostOf(safeUrl) : null,
      ...author,
    };
  });
}
