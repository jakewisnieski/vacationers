"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/authz";
import { getCurrentTrip } from "@/lib/trip";
import { parseActivityInput, type AddActivityResult } from "@/lib/activities";

/** Post a things-to-do activity to the current trip. Member-only (#27). */
export async function addActivity(
  _prev: AddActivityResult | null,
  formData: FormData,
): Promise<AddActivityResult> {
  const user = await requireMember();

  const parsed = parseActivityInput({
    title: String(formData.get("title") ?? ""),
    note: String(formData.get("note") ?? ""),
    url: String(formData.get("url") ?? ""),
  });
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const trip = await getCurrentTrip();
  if (!trip) {
    return { ok: false, error: "There's no trip to add activities to yet." };
  }

  await prisma.activity.create({
    data: {
      tripId: trip.id,
      authorId: user.memberId,
      title: parsed.value.title,
      note: parsed.value.note,
      url: parsed.value.url,
    },
  });

  revalidatePath("/activities");
  return { ok: true };
}

/** Delete an activity — **author-only** (#27). The `authorId` guard in the where
 * clause makes this atomic: a non-author (or a stale/forged id) matches no row
 * and deletes nothing, so hiding the button is never the only guard. */
export async function deleteActivity(formData: FormData): Promise<void> {
  const user = await requireMember();

  const id = String(formData.get("activityId") ?? "");
  if (!id) return;

  await prisma.activity.deleteMany({ where: { id, authorId: user.memberId } });
  revalidatePath("/activities");
}
