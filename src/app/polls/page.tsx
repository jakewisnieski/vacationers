import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/authz";
import { getCurrentTrip } from "@/lib/trip";
import { buildPollsView, type PollCard, type PollOptionCard } from "@/lib/polls";
import { NewPollForm } from "./NewPollForm";
import { castVote, closePoll } from "./actions";

// The polls board (#29, v0.2.0): a member poses a question with 2+ options, the
// group casts single-choice votes, and results update live. Group-level access
// (#5) — everyone sees and votes on every poll; the author or the owner can
// close one, after which it shows results but takes no new votes.

export default async function PollsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const trip = await getCurrentTrip();

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-serif text-4xl font-semibold">Polls</h1>
          <Link href="/dashboard" className="text-sm text-ink-dim hover:text-ink">
            ← Back home
          </Link>
        </div>
        <p className="mt-2 text-ink-dim">
          {trip
            ? "Settle the group's calls — pose a question, everyone votes, and results update live."
            : "Polls will open once a trip exists."}
        </p>

        {trip ? (
          <PollsBoard
            tripId={trip.id}
            currentMemberId={user.memberId}
            isOwner={user.isOwner}
          />
        ) : null}
      </section>
    </main>
  );
}

async function PollsBoard({
  tripId,
  currentMemberId,
  isOwner,
}: {
  tripId: string;
  currentMemberId: string;
  isOwner: boolean;
}) {
  const rows = await prisma.poll.findMany({
    where: { tripId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      question: true,
      closedAt: true,
      authorId: true,
      createdAt: true,
      author: { select: { name: true, email: true, accentColor: true } },
      options: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          label: true,
          position: true,
          _count: { select: { votes: true } },
        },
      },
      // Total votes for the tallies; the current member's own vote (0 or 1 row)
      // for the "what did I pick?" state — never the whole ballot's votes.
      _count: { select: { votes: true } },
      votes: { where: { memberId: currentMemberId }, select: { optionId: true } },
    },
  });
  const polls = buildPollsView(rows, currentMemberId, isOwner);

  return (
    <>
      <div className="mt-8 rounded-2xl border border-line bg-stage-raised p-6">
        <h2 className="font-serif text-2xl">Start a poll</h2>
        <p className="mt-1 text-sm text-ink-dim">
          A question and at least two options — the group takes it from there.
        </p>
        <div className="mt-4">
          <NewPollForm />
        </div>
      </div>

      <div className="mt-6">
        {polls.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-stage-raised/50 p-10 text-center">
            <p className="text-ink-dim">
              No polls yet — pose the first question and let the group weigh in.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {polls.map((poll) => (
              <PollItem key={poll.id} poll={poll} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function PollItem({ poll }: { poll: PollCard }) {
  return (
    <li className="rounded-2xl border border-line bg-stage-raised p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-xl font-bold">{poll.question}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-dim">
            <Avatar initials={poll.initials} accent={poll.accent} />
            <span className="truncate">{poll.authorName}</span>
            {poll.isClosed && (
              <span className="rounded-full border border-line px-2 py-0.5 text-xs font-medium">
                Closed
              </span>
            )}
          </div>
        </div>
        {poll.canClose && (
          <form action={closePoll} className="shrink-0">
            <input type="hidden" name="pollId" value={poll.id} />
            <button
              type="submit"
              className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-stage"
            >
              Close poll
            </button>
          </form>
        )}
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {poll.options.map((option) => (
          <li key={option.id}>
            <OptionControl poll={poll} option={option} />
          </li>
        ))}
      </ul>

      <p className="mt-3 text-sm text-ink-dim">
        {poll.totalVotes === 0
          ? "No votes yet"
          : `${poll.totalVotes} vote${poll.totalVotes === 1 ? "" : "s"}`}
        {!poll.isClosed && !poll.hasVoted && poll.totalVotes > 0 && (
          <span> · you haven&apos;t voted</span>
        )}
      </p>
    </li>
  );
}

// One option: a clickable vote control on an open poll, a static result row on a
// closed one. Both share the label + tally + percent bar; only the open poll
// wraps it in a `castVote` form. `aria-pressed` reflects the member's choice.
function OptionControl({
  poll,
  option,
}: {
  poll: PollCard;
  option: PollOptionCard;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span aria-hidden>{option.isMyVote ? "◉" : "○"}</span>
          <span className="truncate font-medium">{option.label}</span>
        </span>
        <span className="shrink-0 tabular-nums text-xs text-ink-dim">
          {option.voteCount} · {option.percent}%
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-action"
          style={{ width: `${option.percent}%` }}
        />
      </div>
    </>
  );

  const base = `block w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
    option.isMyVote
      ? "border-action bg-action/15 text-action"
      : "border-line text-ink"
  }`;

  if (poll.isClosed) {
    return <div className={base}>{inner}</div>;
  }

  return (
    <form action={castVote}>
      <input type="hidden" name="pollId" value={poll.id} />
      <input type="hidden" name="optionId" value={option.id} />
      <button
        type="submit"
        aria-pressed={option.isMyVote}
        aria-label={
          option.isMyVote
            ? `Remove your vote for ${option.label}`
            : `Vote for ${option.label}`
        }
        className={`${base} hover:bg-stage`}
      >
        {inner}
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
