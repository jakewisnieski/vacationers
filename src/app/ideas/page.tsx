import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/authz";
import { getCurrentTrip } from "@/lib/trip";
import { buildIdeasView, type IdeaCard } from "@/lib/ideas";
import { AddIdeaForm } from "./AddIdeaForm";
import { deleteIdea, toggleIdeaVote } from "./actions";

// The destination ideas board (#26, v0.2.0): every member posts where they'd
// like the trip to go, on the current trip. Group-level access (#5) — everyone
// sees every idea; you can only delete your own. Members upvote to surface the
// group's favorites, and the board sorts by newest or most-voted (#28).

/** Board ordering: "new" (newest first) or "top" (most-voted first). */
type SortMode = "new" | "top";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const { sort } = await searchParams;
  const sortMode: SortMode = sort === "top" ? "top" : "new";
  const trip = await getCurrentTrip();

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-serif text-4xl font-semibold">Destination ideas</h1>
          <Link href="/dashboard" className="text-sm text-ink-dim hover:text-ink">
            ← Back home
          </Link>
        </div>
        <p className="mt-2 text-ink-dim">
          {trip
            ? `Pitch where the ${trip.year} trip should go. Everyone sees every idea — you can remove your own.`
            : "Where should we go? Ideas will open once a trip exists."}
        </p>

        {trip ? (
          <IdeasBoard
            tripId={trip.id}
            currentMemberId={user.memberId}
            sort={sortMode}
          />
        ) : null}
      </section>
    </main>
  );
}

async function IdeasBoard({
  tripId,
  currentMemberId,
  sort,
}: {
  tripId: string;
  currentMemberId: string;
  sort: SortMode;
}) {
  const rows = await prisma.idea.findMany({
    where: { tripId, status: "approved" },
    // Most-voted first when sorting by "top", with newest breaking ties; else
    // strictly newest. The count lives in the relation, so order by it directly.
    orderBy:
      sort === "top"
        ? [{ votes: { _count: "desc" } }, { createdAt: "desc" }]
        : { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      url: true,
      authorId: true,
      author: { select: { name: true, email: true, accentColor: true } },
      // Total votes for the count; the current member's own vote (0 or 1 row)
      // for the "have I voted?" state — never the whole vote list.
      _count: { select: { votes: true } },
      votes: { where: { memberId: currentMemberId }, select: { id: true } },
    },
  });
  const ideas = buildIdeasView(rows, currentMemberId);

  return (
    <>
      <div className="mt-8 rounded-2xl border border-line bg-stage-raised p-6">
        <h2 className="font-serif text-2xl">Add an idea</h2>
        <p className="mt-1 text-sm text-ink-dim">
          A title is all you need; a note and a link are optional.
        </p>
        <div className="mt-4">
          <AddIdeaForm />
        </div>
      </div>

      <div className="mt-6">
        {ideas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-stage-raised/50 p-10 text-center">
            <p className="text-ink-dim">
              No ideas yet — post the first one and get the group dreaming.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2 text-sm">
              <span className="text-ink-dim">Sort</span>
              <SortTab active={sort === "new"} href="/ideas" label="Newest" />
              <SortTab
                active={sort === "top"}
                href="/ideas?sort=top"
                label="Most voted"
              />
            </div>
            <ul className="flex flex-col gap-3">
              {ideas.map((idea) => (
                <IdeaItem key={idea.id} idea={idea} />
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}

function SortTab({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-full border px-3 py-1 font-medium transition-colors ${
        active
          ? "border-action bg-action/15 text-action"
          : "border-line text-ink-dim hover:text-ink hover:bg-stage"
      }`}
    >
      {label}
    </Link>
  );
}

function IdeaItem({ idea }: { idea: IdeaCard }) {
  return (
    <li className="rounded-2xl border border-line bg-stage-raised p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-xl font-bold">{idea.title}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-ink-dim">
            <Avatar initials={idea.initials} accent={idea.accent} />
            <span className="truncate">{idea.authorName}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <VoteButton idea={idea} />
          {idea.canDelete && (
            <form action={deleteIdea}>
              <input type="hidden" name="ideaId" value={idea.id} />
              <button
                type="submit"
                className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-stage"
              >
                Remove
              </button>
            </form>
          )}
        </div>
      </div>

      {idea.description && (
        <p className="mt-3 whitespace-pre-line text-sm text-ink">{idea.description}</p>
      )}

      {idea.url && (
        <a
          href={idea.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-dim transition-colors hover:text-ink"
        >
          <span aria-hidden>🔗</span>
          <span className="truncate">{idea.linkHost ?? "Link"}</span>
        </a>
      )}
    </li>
  );
}

function VoteButton({ idea }: { idea: IdeaCard }) {
  return (
    <form action={toggleIdeaVote}>
      <input type="hidden" name="ideaId" value={idea.id} />
      <button
        type="submit"
        aria-pressed={idea.hasVoted}
        aria-label={
          idea.hasVoted
            ? `Remove your upvote (${idea.voteCount})`
            : `Upvote this idea (${idea.voteCount})`
        }
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
          idea.hasVoted
            ? "border-action bg-action/15 text-action"
            : "border-line text-ink-dim hover:bg-stage hover:text-ink"
        }`}
      >
        <span aria-hidden>▲</span>
        <span className="tabular-nums">{idea.voteCount}</span>
      </button>
    </form>
  );
}

function Avatar({ initials, accent }: { initials: string; accent: string }) {
  return (
    <span
      className="inline-grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.6rem] font-semibold text-white"
      style={{ background: accent }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
