// Pure roster helpers — no I/O, so the email normalization and the roster
// view-model can be unit-tested without a database (#14). The server actions
// and the screen build on these.

/** Trim + lowercase so the allowlist gate never forks on case/whitespace (#5). */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

// Deliberately permissive: a pragmatic "looks like an email" check, not RFC
// 5322. We only need to reject obvious typos before writing an invite.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

/** Result of the add-invite action, surfaced inline on the form. */
export type AddInviteResult = { ok: true } | { ok: false; error: string };

export type RosterMember = {
  email: string;
  name: string | null;
  isOwner: boolean;
  // A Member whose invite was revoked keeps their history but can no longer
  // sign in (revoke-invite-only, #14) — surfaced as an "access revoked" state.
  allowlisted: boolean;
};

export type PendingInvite = { email: string };

export type RosterView = {
  members: RosterMember[];
  pending: PendingInvite[];
};

/**
 * Fold the Member set and the AllowlistEntry set into one view:
 * - `members`: everyone who has signed in (has a Member row), tagged with
 *   whether they're still allowlisted;
 * - `pending`: allowlisted emails that have never signed in (no Member yet).
 *
 * Comparison is case-insensitive to mirror the citext columns (#5).
 */
export function buildRosterView(
  members: { email: string; name: string | null; isOwner: boolean }[],
  allowlist: { email: string }[],
): RosterView {
  const allowed = new Set(allowlist.map((e) => e.email.toLowerCase()));
  const memberEmails = new Set(members.map((m) => m.email.toLowerCase()));

  const rosterMembers: RosterMember[] = members
    .map((m) => ({
      email: m.email,
      name: m.name,
      isOwner: m.isOwner,
      allowlisted: allowed.has(m.email.toLowerCase()),
    }))
    .sort((a, b) => {
      // Owner first, then alphabetical by email — stable and predictable.
      if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
      return a.email.localeCompare(b.email);
    });

  const pending: PendingInvite[] = allowlist
    .filter((e) => !memberEmails.has(e.email.toLowerCase()))
    .map((e) => ({ email: e.email }))
    .sort((a, b) => a.email.localeCompare(b.email));

  return { members: rosterMembers, pending };
}
