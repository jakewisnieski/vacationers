"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/authz";
import { isValidEmail, normalizeEmail, type AddInviteResult } from "@/lib/roster";

/** Owner-only: invite an email onto the DB allowlist (#5/#14). Idempotent —
 * re-adding an existing invite is a no-op. */
export async function addAllowlistEmail(
  _prev: AddInviteResult | null,
  formData: FormData,
): Promise<AddInviteResult> {
  await requireOwner();

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!isValidEmail(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  await prisma.allowlistEntry.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  revalidatePath("/roster");
  return { ok: true };
}

/** Owner-only: revoke an invite. Revoke-invite-only — the Member row and its
 * history are kept; the email simply can't sign in again (#14). The group's one
 * privileged account (#5) can never be revoked. */
export async function revokeAllowlistEmail(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) return;

  if (email === owner.email?.toLowerCase()) {
    throw new Error("The owner can't remove their own access.");
  }
  const target = await prisma.member.findUnique({ where: { email } });
  if (target?.isOwner) {
    throw new Error("The owner can't be removed from the roster.");
  }

  await prisma.allowlistEntry.deleteMany({ where: { email } });
  revalidatePath("/roster");
}
