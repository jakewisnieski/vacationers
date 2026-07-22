import { auth } from "@/auth";

// Server-side identity helpers. The roster is the one owner-only surface
// (#5/#14); authz is enforced here and in every mutation, never in the UI
// alone. `auth()` returns null (or a user-less session, post fail-closed) when
// there's no valid identity — both collapse to `null` here.

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Return the owner, or throw — use to gate owner-only mutations server-side. */
export async function requireOwner() {
  const user = await getSessionUser();
  if (!user?.isOwner) {
    throw new Error("Forbidden: this action is restricted to the group owner.");
  }
  return user;
}

/**
 * Return the signed-in member, or throw — use to gate member-only mutations
 * (posting ideas, votes, comments) server-side. A non-null session user always
 * carries a resolved `memberId` (the session callback fails closed otherwise,
 * #14), so presence of the user is the whole check.
 */
export async function requireMember() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Forbidden: sign in as a group member to do that.");
  }
  return user;
}
