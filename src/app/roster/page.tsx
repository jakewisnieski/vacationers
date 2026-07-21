import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/authz";
import { buildRosterView } from "@/lib/roster";
import { AddInviteForm } from "./AddInviteForm";
import { revokeAllowlistEmail } from "./actions";

export default async function RosterPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  // Server-side authz (#14): the roster is owner-only. Non-owners get a plain
  // "not authorized" view and never the roster data — and every mutation
  // re-checks owner independently, so hiding the UI is never the only guard.
  if (!user.isOwner) {
    return (
      <main className="flex-1">
        <section className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className="font-serif text-4xl font-semibold">Not authorized</h1>
          <p className="mt-4 text-ink-dim">
            The roster is managed by your group&apos;s owner.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-stage"
          >
            Back home
          </Link>
        </section>
      </main>
    );
  }

  const [members, allowlist] = await Promise.all([
    prisma.member.findMany({
      select: { email: true, name: true, isOwner: true },
    }),
    prisma.allowlistEntry.findMany({ select: { email: true } }),
  ]);
  const { members: rows, pending } = buildRosterView(members, allowlist);

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-serif text-4xl font-semibold">Roster</h1>
          <Link href="/" className="text-sm text-ink-dim hover:text-ink">
            ← Back home
          </Link>
        </div>
        <p className="mt-2 text-ink-dim">
          Invite-only. Add an email to let that Google account sign in; remove it
          to revoke access on their next sign-in.
        </p>

        <div className="mt-8 rounded-2xl border border-line bg-stage-raised p-6">
          <h2 className="font-serif text-2xl">Add someone</h2>
          <p className="mt-1 text-sm text-ink-dim">
            They&apos;ll be able to sign in with this Google account.
          </p>
          <div className="mt-4">
            <AddInviteForm />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-stage-raised p-6">
          <h2 className="font-serif text-2xl">Members</h2>
          <ul className="mt-4 divide-y divide-line">
            {rows.map((m) => (
              <li
                key={m.email}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {m.name ?? m.email}
                    </span>
                    {m.isOwner && (
                      <span className="rounded-full bg-action px-2 py-0.5 text-xs font-medium text-white">
                        Owner
                      </span>
                    )}
                    {!m.allowlisted && (
                      <span className="rounded-full border border-line px-2 py-0.5 text-xs font-medium text-ink-dim">
                        Access revoked
                      </span>
                    )}
                  </div>
                  {m.name && (
                    <p className="truncate text-sm text-ink-dim">{m.email}</p>
                  )}
                </div>
                {!m.isOwner && m.allowlisted && (
                  <form action={revokeAllowlistEmail}>
                    <input type="hidden" name="email" value={m.email} />
                    <button
                      type="submit"
                      className="shrink-0 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-stage"
                    >
                      Remove
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </div>

        {pending.length > 0 && (
          <div className="mt-6 rounded-2xl border border-line bg-stage-raised p-6">
            <h2 className="font-serif text-2xl">Pending invites</h2>
            <p className="mt-1 text-sm text-ink-dim">
              Invited, but haven&apos;t signed in yet.
            </p>
            <ul className="mt-4 divide-y divide-line">
              {pending.map((p) => (
                <li
                  key={p.email}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className="truncate">{p.email}</span>
                  <form action={revokeAllowlistEmail}>
                    <input type="hidden" name="email" value={p.email} />
                    <button
                      type="submit"
                      className="shrink-0 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-stage"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
