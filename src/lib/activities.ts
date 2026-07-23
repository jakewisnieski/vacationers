// Pure activities-board helpers — no I/O, so add-activity validation and the
// board view-model unit-test without a database (#27). The /activities screen
// and its server actions build on these. URL checks come from ./url and author
// display/initials/accent + the delete gate from ./author, shared with the
// ideas board (#26).

import { hostOf, isValidUrl } from "./url";
import { presentAuthor, type AuthorInput } from "./author";

export const ACTIVITY_TITLE_MAX = 120;
export const ACTIVITY_NOTE_MAX = 500;
// Matches the ideas board — caps the one otherwise unbounded field.
export const ACTIVITY_URL_MAX = 2048;

/** Result of the add-activity action, surfaced inline on the form. */
export type AddActivityResult = { ok: true } | { ok: false; error: string };

/** Cleaned, storage-ready activity fields (optional fields collapsed to null). */
export type ParsedActivity = {
  title: string;
  note: string | null;
  url: string | null;
};

/**
 * Validate + normalize the add-activity form fields. Title is required; note
 * and link are optional; a supplied link must be a real http(s) URL. Trimmed
 * empty optionals become `null`.
 */
export function parseActivityInput(raw: {
  title: string;
  note: string;
  url: string;
}): { ok: true; value: ParsedActivity } | { ok: false; error: string } {
  const title = raw.title.trim();
  if (!title) return { ok: false, error: "Give the activity a title." };
  if (title.length > ACTIVITY_TITLE_MAX) {
    return {
      ok: false,
      error: `Keep the title under ${ACTIVITY_TITLE_MAX} characters.`,
    };
  }

  const note = raw.note.trim();
  if (note.length > ACTIVITY_NOTE_MAX) {
    return {
      ok: false,
      error: `Keep the note under ${ACTIVITY_NOTE_MAX} characters.`,
    };
  }

  const url = raw.url.trim();
  if (url) {
    if (url.length > ACTIVITY_URL_MAX) {
      return {
        ok: false,
        error: `Keep the link under ${ACTIVITY_URL_MAX} characters.`,
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
      note: note || null,
      url: url || null,
    },
  };
}

/** The raw shape the page pulls from Prisma — the fields the board needs. */
export type ActivityRow = {
  id: string;
  title: string;
  note: string | null;
  url: string | null;
  authorId: string | null;
  author: AuthorInput;
};

export type ActivityCard = {
  id: string;
  title: string;
  note: string | null;
  url: string | null;
  /** Bare host for the link chip, e.g. "airbnb.com" — null when there's no link. */
  linkHost: string | null;
  /** Author display name, or "Someone" for an author-less (removed member) row. */
  authorName: string;
  initials: string;
  accent: string;
  /** True when the current member authored it — only then may they delete it. */
  canDelete: boolean;
};

/**
 * Fold Activity rows (already ordered by the query) into board card view-models,
 * resolving author identity (a removed poster shows as "Someone"), a stable
 * accent, a link host, and whether the current member may delete each activity
 * (author-only, #27).
 */
export function buildActivitiesView(
  rows: ActivityRow[],
  currentMemberId: string,
): ActivityCard[] {
  return rows.map((row) => {
    // Re-validate the stored URL at render, never trusting the write path —
    // only a real http(s) URL becomes a link (mirrors the ideas board).
    const safeUrl = row.url && isValidUrl(row.url) ? row.url : null;
    const author = presentAuthor(row.author, row.authorId, currentMemberId, {
      name: "Someone",
      initials: "?",
    });
    return {
      id: row.id,
      title: row.title,
      note: row.note,
      url: safeUrl,
      linkHost: safeUrl ? hostOf(safeUrl) : null,
      ...author,
    };
  });
}
