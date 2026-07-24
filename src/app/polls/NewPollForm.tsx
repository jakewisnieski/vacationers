"use client";

import { useActionState, useRef, useState } from "react";
import {
  POLL_MAX_OPTIONS,
  POLL_MIN_OPTIONS,
  POLL_OPTION_MAX,
  POLL_QUESTION_MAX,
  type CreatePollResult,
} from "@/lib/polls";
import { createPoll } from "./actions";

// Start with three option inputs — two is the floor, three nudges toward a real
// choice without crowding the form.
const DEFAULT_OPTION_COUNT = 3;
const defaultRows = () =>
  Array.from({ length: DEFAULT_OPTION_COUNT }, (_, i) => i);

export function NewPollForm() {
  const [state, action, pending] = useActionState<
    CreatePollResult | null,
    FormData
  >(createPoll, null);

  // Reset the whole fieldset after a *successful* create by remounting it under
  // a new key — clearing the question, options, and row count in one stroke. We
  // bump the key while rendering (React's supported "adjust state on a changed
  // value" pattern) rather than in an effect. On a validation error the key is
  // unchanged, so the fields stay mounted and keep what the author typed.
  const [generation, setGeneration] = useState(0);
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state?.ok) setGeneration((g) => g + 1);
  }

  return (
    <PollFields
      key={generation}
      action={action}
      pending={pending}
      error={state && !state.ok ? state.error : null}
    />
  );
}

function PollFields({
  action,
  pending,
  error,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
}) {
  // Uncontrolled text inputs (values live in the DOM); `rows` only tracks how
  // many option inputs exist, keyed so add/remove keep each surviving input's
  // typed value across re-renders.
  const [rows, setRows] = useState<number[]>(defaultRows);
  const nextKey = useRef(DEFAULT_OPTION_COUNT);

  function addOption() {
    setRows((r) => (r.length >= POLL_MAX_OPTIONS ? r : [...r, nextKey.current++]));
  }
  function removeOption(key: number) {
    setRows((r) => (r.length <= POLL_MIN_OPTIONS ? r : r.filter((k) => k !== key)));
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        type="text"
        name="question"
        required
        maxLength={POLL_QUESTION_MAX}
        placeholder="What should the group decide? (e.g. Which week works best?)"
        className="rounded-xl border border-line bg-stage px-4 py-2.5 text-sm text-ink placeholder:text-ink-dim/60 focus:border-action focus:outline-none"
      />

      <div className="flex flex-col gap-2">
        {rows.map((key, i) => (
          <div key={key} className="flex items-center gap-2">
            <input
              type="text"
              name="option"
              maxLength={POLL_OPTION_MAX}
              placeholder={`Option ${i + 1}`}
              className="min-w-0 flex-1 rounded-full border border-line bg-stage px-4 py-2 text-sm text-ink placeholder:text-ink-dim/60 focus:border-action focus:outline-none"
            />
            {rows.length > POLL_MIN_OPTIONS && (
              <button
                type="button"
                onClick={() => removeOption(key)}
                aria-label={`Remove option ${i + 1}`}
                className="shrink-0 rounded-full border border-line px-2.5 py-2 text-sm text-ink-dim transition-colors hover:bg-stage hover:text-ink"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={addOption}
          disabled={rows.length >= POLL_MAX_OPTIONS}
          className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink-dim transition-colors hover:bg-stage hover:text-ink disabled:opacity-50"
        >
          + Add option
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-action px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-action-strong disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create poll"}
        </button>
      </div>

      {error && <p className="text-sm text-accent-3">{error}</p>}
    </form>
  );
}
