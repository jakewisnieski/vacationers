"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  COMMENT_BODY_MAX,
  type AddCommentResult,
  type CommentTargetType,
} from "@/lib/comments";
import { addComment } from "./actions";

// The post-a-comment form (#30). Target-agnostic: it carries the (targetType,
// targetId) as hidden fields, so the same form serves ideas, activities, and
// polls. Clears the box on a successful post (uncontrolled + form.reset).
export function AddCommentForm({
  targetType,
  targetId,
}: {
  targetType: CommentTargetType;
  targetId: string;
}) {
  const [state, action, pending] = useActionState<
    AddCommentResult | null,
    FormData
  >(addComment, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <textarea
        name="body"
        required
        rows={2}
        maxLength={COMMENT_BODY_MAX}
        placeholder="Add a comment…"
        className="resize-y rounded-xl border border-line bg-stage px-3 py-2 text-sm text-ink placeholder:text-ink-dim/60 focus:border-action focus:outline-none"
      />
      <div className="flex items-center justify-between gap-2">
        {state && !state.ok ? (
          <p className="text-sm text-accent-3">{state.error}</p>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-action px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-action-strong disabled:opacity-60"
        >
          {pending ? "Posting…" : "Comment"}
        </button>
      </div>
    </form>
  );
}
