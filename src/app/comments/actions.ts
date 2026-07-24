"use server";

import { CommentTarget } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/authz";
import { parseCommentInput, type AddCommentResult } from "@/lib/comments";

// Polymorphic comment actions (#30). The comment thread targets an idea,
// activity, or poll via (targetType, targetId); this slice wires only ideas in
// the UI, but the actions are target-agnostic so activities/polls reuse them
// with no change. Member-gated; delete is author-only.

/** The board path to revalidate for each comment target, so the thread refreshes
 * in place after a post/delete. */
const TARGET_PATH: Record<CommentTarget, string> = {
  idea: "/ideas",
  activity: "/activities",
  poll: "/polls",
};

/** A value is a valid comment target only if it's one of the enum's members. */
function isCommentTarget(value: string): value is CommentTarget {
  return (Object.values(CommentTarget) as string[]).includes(value);
}

/** Does the polymorphic target actually exist? Checked before a comment is
 * created so a stale/forged targetId can't spawn an orphan comment (the target
 * has no relational FK — integrity for it lives here, not in the DB). */
async function targetExists(
  targetType: CommentTarget,
  targetId: string,
): Promise<boolean> {
  switch (targetType) {
    case "idea":
      return (await prisma.idea.count({ where: { id: targetId } })) > 0;
    case "activity":
      return (await prisma.activity.count({ where: { id: targetId } })) > 0;
    case "poll":
      return (await prisma.poll.count({ where: { id: targetId } })) > 0;
    default:
      return false;
  }
}

/** Post a comment on a target (idea/activity/poll). Member-only (#30). Validates
 * the target type + that the target still exists before writing. */
export async function addComment(
  _prev: AddCommentResult | null,
  formData: FormData,
): Promise<AddCommentResult> {
  const user = await requireMember();

  const targetTypeRaw = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "");
  if (!isCommentTarget(targetTypeRaw)) {
    return { ok: false, error: "That's not something you can comment on." };
  }
  if (!targetId) return { ok: false, error: "There's nothing to comment on." };

  const parsed = parseCommentInput({ body: String(formData.get("body") ?? "") });
  if (!parsed.ok) return { ok: false, error: parsed.error };

  if (!(await targetExists(targetTypeRaw, targetId))) {
    return { ok: false, error: "That item no longer exists." };
  }

  await prisma.comment.create({
    data: {
      targetType: targetTypeRaw,
      targetId,
      authorId: user.memberId,
      body: parsed.value.body,
    },
  });

  revalidatePath(TARGET_PATH[targetTypeRaw]);
  return { ok: true };
}

/** Delete a comment — **author-only** (#30). The `authorId` guard in the where
 * clause makes this atomic: a non-author (or a stale/forged id) matches no row
 * and deletes nothing, so hiding the button is never the only guard. The
 * `targetType` is passed only to revalidate the right board. */
export async function deleteComment(formData: FormData): Promise<void> {
  const user = await requireMember();

  const id = String(formData.get("commentId") ?? "");
  if (!id) return;

  await prisma.comment.deleteMany({ where: { id, authorId: user.memberId } });

  const targetTypeRaw = String(formData.get("targetType") ?? "");
  revalidatePath(isCommentTarget(targetTypeRaw) ? TARGET_PATH[targetTypeRaw] : "/ideas");
}
