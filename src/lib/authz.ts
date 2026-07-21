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
