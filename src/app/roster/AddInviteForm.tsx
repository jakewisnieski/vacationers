"use client";

import { useActionState } from "react";
import type { AddInviteResult } from "@/lib/roster";
import { addAllowlistEmail } from "./actions";

export function AddInviteForm() {
  const [state, action, pending] = useActionState<
    AddInviteResult | null,
    FormData
  >(addAllowlistEmail, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="friend@example.com"
          className="min-w-64 flex-1 rounded-full border border-line bg-stage px-4 py-2 text-sm text-ink placeholder:text-ink-dim/60 focus:border-action focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-action px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-action-strong disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add to roster"}
        </button>
      </div>
      {state && !state.ok && (
        <p className="text-sm text-accent-3">{state.error}</p>
      )}
      {state?.ok && <p className="text-sm text-accent-4">Invite added.</p>}
    </form>
  );
}
