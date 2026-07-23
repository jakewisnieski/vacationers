"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/authz";
import { getCurrentTrip } from "@/lib/trip";
import { parseIdeaInput, type AddIdeaResult } from "@/lib/ideas";

/** Post a destination idea to the current trip. Member-only; the idea is
 * `approved` immediately (the `suggested` review gate is the Qwen3-import path,
 * deferred to v0.4.0). */
export async function addIdea(
  _prev: AddIdeaResult | null,
  formData: FormData,
): Promise<AddIdeaResult> {
  const user = await requireMember();

  const parsed = parseIdeaInput({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    url: String(formData.get("url") ?? ""),
  });
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const trip = await getCurrentTrip();
  if (!trip) return { ok: false, error: "There's no trip to add ideas to yet." };

  await prisma.idea.create({
    data: {
      tripId: trip.id,
      authorId: user.memberId,
      title: parsed.value.title,
      description: parsed.value.description,
      url: parsed.value.url,
      // status defaults to `approved` — member-authored ideas surface at once.
    },
  });

  revalidatePath("/ideas");
  return { ok: true };
}

/** Delete an idea — **author-only** (#26). The `authorId` guard in the where
 * clause makes this atomic: a non-author (or a stale/forged id) matches no row
 * and deletes nothing, so hiding the button is never the only guard. */
export async function deleteIdea(formData: FormData): Promise<void> {
  const user = await requireMember();

  const id = String(formData.get("ideaId") ?? "");
  if (!id) return;

  await prisma.idea.deleteMany({ where: { id, authorId: user.memberId } });
  revalidatePath("/ideas");
}

/** Toggle the current member's upvote on an idea (#28). Idempotent: removes the
 * vote if one exists, else adds one — so a click is vote / un-vote. The
 * `@@unique([ideaId, memberId])` constraint is the ultimate guard against a
 * double-vote race; the create is wrapped to absorb that race and a stale id. */
export async function toggleIdeaVote(formData: FormData): Promise<void> {
  const user = await requireMember();

  const ideaId = String(formData.get("ideaId") ?? "");
  if (!ideaId) return;

  try {
    const removed = await prisma.ideaVote.deleteMany({
      where: { ideaId, memberId: user.memberId },
    });
    if (removed.count === 0) {
      await prisma.ideaVote.create({
        data: { ideaId, memberId: user.memberId },
      });
    }
  } catch (error) {
    // A concurrent vote (P2002 unique) or a stale/forged ideaId (P2003 FK): the
    // vote state already matches the click's intent, or the idea is gone —
    // nothing to surface to the voter. Anything else is a real fault: rethrow.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
  }

  revalidatePath("/ideas");
}
