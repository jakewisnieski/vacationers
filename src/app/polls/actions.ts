"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/authz";
import { getCurrentTrip } from "@/lib/trip";
import { parsePollInput, type CreatePollResult } from "@/lib/polls";

/** Create a poll on the current trip: a question + its ordered options. Member
 * only (#29). The options are written in input order via `position`, so the
 * ballot always renders the way the author wrote it. */
export async function createPoll(
  _prev: CreatePollResult | null,
  formData: FormData,
): Promise<CreatePollResult> {
  const user = await requireMember();

  const parsed = parsePollInput({
    question: String(formData.get("question") ?? ""),
    // The form posts one `option` field per input; blanks are dropped in parse.
    options: formData.getAll("option").map((o) => String(o)),
  });
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const trip = await getCurrentTrip();
  if (!trip) return { ok: false, error: "There's no trip to add a poll to yet." };

  await prisma.poll.create({
    data: {
      tripId: trip.id,
      authorId: user.memberId,
      question: parsed.value.question,
      options: {
        create: parsed.value.options.map((label, position) => ({
          label,
          position,
        })),
      },
    },
  });

  revalidatePath("/polls");
  return { ok: true };
}

/** Cast, move, or retract the current member's vote on a poll (#29). Single-
 * choice: at most one vote per member per poll. Clicking an option you haven't
 * chosen casts/moves your vote to it; clicking your current choice retracts it.
 * The `@@unique([pollId, memberId])` constraint is the ultimate guard against a
 * double-vote race; benign races on the write are absorbed. */
export async function castVote(formData: FormData): Promise<void> {
  const user = await requireMember();

  const pollId = String(formData.get("pollId") ?? "");
  const optionId = String(formData.get("optionId") ?? "");
  if (!pollId || !optionId) return;

  // The option must belong to this poll AND the poll must be open. A mismatched
  // option, a stale/forged id, or a closed poll matches nothing → silent no-op,
  // so hiding the ballot on a closed poll is never the only guard.
  const option = await prisma.pollOption.findFirst({
    where: { id: optionId, pollId, poll: { closedAt: null } },
    select: { id: true },
  });
  if (!option) return;

  const key = { pollId_memberId: { pollId, memberId: user.memberId } };
  try {
    const existing = await prisma.pollVote.findUnique({
      where: key,
      select: { id: true, optionId: true },
    });
    if (existing?.optionId === optionId) {
      // Re-clicking the current choice retracts the vote (toggle off).
      await prisma.pollVote.delete({ where: { id: existing.id } });
    } else {
      // No vote yet → create; a vote on another option → move it (never a 2nd row).
      await prisma.pollVote.upsert({
        where: key,
        create: { pollId, optionId, memberId: user.memberId },
        update: { optionId },
      });
    }
  } catch (error) {
    // Benign, expected races only: a concurrent first vote losing the unique race
    // (P2002), a stale poll/option/member FK (P2003), or the row vanishing under a
    // concurrent retract (P2025 on delete). In each, the vote already reflects the
    // click's intent or the target is gone. Any other error is a real fault.
    const benign =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" ||
        error.code === "P2003" ||
        error.code === "P2025");
    if (!benign) throw error;
  }

  revalidatePath("/polls");
}

/** Close a poll (#29) — its **author or the group owner**. Atomic: the guard
 * lives in the `where`, so a non-author/non-owner (or a stale id, or an already-
 * closed poll) matches no row and closes nothing. A closed poll takes no new
 * votes (enforced in `castVote`) but still shows its results. */
export async function closePoll(formData: FormData): Promise<void> {
  const user = await requireMember();

  const pollId = String(formData.get("pollId") ?? "");
  if (!pollId) return;

  // Owner may close any open poll; everyone else only their own. `closedAt: null`
  // keeps it idempotent — re-closing an already-closed poll is a no-op.
  const where = user.isOwner
    ? { id: pollId, closedAt: null }
    : { id: pollId, authorId: user.memberId, closedAt: null };

  await prisma.poll.updateMany({ where, data: { closedAt: new Date() } });
  revalidatePath("/polls");
}
