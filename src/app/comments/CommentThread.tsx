import { type CommentCard, type CommentTargetType } from "@/lib/comments";
import { AddCommentForm } from "./AddCommentForm";
import { deleteComment } from "./actions";

// A discussion thread under a target (#30): the comments in order, each with its
// author + an author-only delete, then the add-comment form. Reusable across
// ideas, activities, and polls — the caller passes the target and the already-
// built comment cards. This slice mounts it only on the ideas board.
export function CommentThread({
  targetType,
  targetId,
  comments,
}: {
  targetType: CommentTargetType;
  targetId: string;
  comments: CommentCard[];
}) {
  return (
    <div className="mt-4 border-t border-line pt-4">
      <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-dim">
        {comments.length === 0 ? "Discussion" : `Discussion · ${comments.length}`}
      </h4>

      {comments.length > 0 && (
        <ul className="mt-3 flex flex-col gap-3">
          {comments.map((comment) => (
            <li key={comment.id} className="flex items-start gap-2">
              <Avatar initials={comment.initials} accent={comment.accent} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {comment.authorName}
                  </span>
                  {comment.canDelete && (
                    <form action={deleteComment} className="shrink-0">
                      <input type="hidden" name="commentId" value={comment.id} />
                      <input type="hidden" name="targetType" value={targetType} />
                      <button
                        type="submit"
                        aria-label="Delete your comment"
                        className="text-xs font-medium text-ink-dim transition-colors hover:text-ink"
                      >
                        Delete
                      </button>
                    </form>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-line break-words text-sm text-ink">
                  {comment.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddCommentForm targetType={targetType} targetId={targetId} />
    </div>
  );
}

function Avatar({ initials, accent }: { initials: string; accent: string }) {
  return (
    <span
      className="mt-0.5 inline-grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.6rem] font-semibold text-white"
      style={{ background: accent }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
