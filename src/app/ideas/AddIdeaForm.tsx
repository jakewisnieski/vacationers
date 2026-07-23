"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  IDEA_DESCRIPTION_MAX,
  IDEA_TITLE_MAX,
  IDEA_URL_MAX,
  type AddIdeaResult,
} from "@/lib/ideas";
import { addIdea } from "./actions";

export function AddIdeaForm() {
  const [state, action, pending] = useActionState<AddIdeaResult | null, FormData>(
    addIdea,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields after a successful post so the next idea starts fresh.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input
        type="text"
        name="title"
        required
        maxLength={IDEA_TITLE_MAX}
        placeholder="Where should we go? (e.g. Reykjavík)"
        className="rounded-xl border border-line bg-stage px-4 py-2.5 text-sm text-ink placeholder:text-ink-dim/60 focus:border-action focus:outline-none"
      />
      <textarea
        name="description"
        rows={2}
        maxLength={IDEA_DESCRIPTION_MAX}
        placeholder="Why this one? (optional)"
        className="resize-y rounded-xl border border-line bg-stage px-4 py-2.5 text-sm text-ink placeholder:text-ink-dim/60 focus:border-action focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="url"
          name="url"
          maxLength={IDEA_URL_MAX}
          placeholder="Link (optional)"
          className="min-w-56 flex-1 rounded-full border border-line bg-stage px-4 py-2 text-sm text-ink placeholder:text-ink-dim/60 focus:border-action focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-action px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-action-strong disabled:opacity-60"
        >
          {pending ? "Posting…" : "Post idea"}
        </button>
      </div>
      {state && !state.ok && <p className="text-sm text-accent-3">{state.error}</p>}
    </form>
  );
}
