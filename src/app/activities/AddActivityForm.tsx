"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  ACTIVITY_NOTE_MAX,
  ACTIVITY_TITLE_MAX,
  ACTIVITY_URL_MAX,
  type AddActivityResult,
} from "@/lib/activities";
import { addActivity } from "./actions";

export function AddActivityForm() {
  const [state, action, pending] = useActionState<AddActivityResult | null, FormData>(
    addActivity,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields after a successful add so the next one starts fresh.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input
        type="text"
        name="title"
        required
        maxLength={ACTIVITY_TITLE_MAX}
        placeholder="What should we do? (e.g. Snorkel Silfra)"
        className="rounded-xl border border-line bg-stage px-4 py-2.5 text-sm text-ink placeholder:text-ink-dim/60 focus:border-action focus:outline-none"
      />
      <textarea
        name="note"
        rows={2}
        maxLength={ACTIVITY_NOTE_MAX}
        placeholder="Any details? (optional)"
        className="resize-y rounded-xl border border-line bg-stage px-4 py-2.5 text-sm text-ink placeholder:text-ink-dim/60 focus:border-action focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="url"
          name="url"
          maxLength={ACTIVITY_URL_MAX}
          placeholder="Link (optional)"
          className="min-w-56 flex-1 rounded-full border border-line bg-stage px-4 py-2 text-sm text-ink placeholder:text-ink-dim/60 focus:border-action focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-action px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-action-strong disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add to list"}
        </button>
      </div>
      {state && !state.ok && <p className="text-sm text-accent-3">{state.error}</p>}
    </form>
  );
}
