// Pure ideas-board helpers — no I/O, so the add-idea validation and the board
// view-model can be unit-tested without a database (#26). The server actions and
// the /ideas screen build on these. Author display/initials/accents are shared
// with the dashboard's view-model (#15).

import { NIGHTFALL_ACCENTS, displayName, initialsFor } from "./dashboard";

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

/** A pragmatic web-URL check — parseable and http(s)-schemed. */
export function isValidUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  return parsed.protocol === "http:" || parsed.protocol === "https:";
}

/** The raw shape the page pulls from Prisma — the fields the board needs. */
export type IdeaRow = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  authorId: string | null;
  author: {
    name: string | null;
    email: string;
    accentColor: string | null;
  } | null;
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

// Neutral (ink-dim) accent for author-less ideas — the Qwen3 import seam (v0.4.0)
// lands rows with no member author; until then no such rows exist.
const IMPORTED_ACCENT = "#9aa3c0";

/**
 * Fold Idea rows (already ordered by the query) into board card view-models,
 * resolving author identity, a stable accent, a link host, and — crucially —
 * whether the current member may delete each idea (author-only, #26).
 */
export function buildIdeasView(
  rows: IdeaRow[],
  currentMemberId: string,
): IdeaCard[] {
  return rows.map((row) => {
    const author = row.author;
    // Re-validate at render, not just at input: any writer (a future imported
    // row, seed, a hand-edited DB value) could carry a non-http(s) URL, and we
    // never want that reaching an <a href>. Only a real web URL becomes a link.
    const safeUrl = row.url && isValidUrl(row.url) ? row.url : null;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      url: safeUrl,
      linkHost: safeUrl ? hostOf(safeUrl) : null,
      authorName: author ? displayName(author.name, author.email) : "Suggested",
      initials: author ? initialsFor(author.name, author.email) : "✦",
      accent: author
        ? (author.accentColor ?? accentForSeed(author.email))
        : IMPORTED_ACCENT,
      canDelete: row.authorId !== null && row.authorId === currentMemberId,
    };
  });
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * A deterministic accent slot from a seed (the author's email), so a given
 * author's ideas share one color even when they have no explicit `accentColor`.
 */
function accentForSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return NIGHTFALL_ACCENTS[Math.abs(hash) % NIGHTFALL_ACCENTS.length];
}
