import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/authz";
import { getCurrentTrip } from "@/lib/trip";
import { buildActivitiesView, type ActivityCard } from "@/lib/activities";
import { AddActivityForm } from "./AddActivityForm";
import { deleteActivity } from "./actions";

// The things-to-do board (#27, v0.2.0): every member adds activities for the
// current trip. Group-level access (#5) — everyone sees the list; you can only
// delete your own.

export default async function ActivitiesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const trip = await getCurrentTrip();

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-serif text-4xl font-semibold">Things to do</h1>
          <Link href="/dashboard" className="text-sm text-ink-dim hover:text-ink">
            ← Back home
          </Link>
        </div>
        <p className="mt-2 text-ink-dim">
          {trip
            ? `Build the shortlist of what to do on the ${trip.year} trip. Everyone sees the list — you can remove your own.`
            : "What should we do? The list opens once a trip exists."}
        </p>

        {trip ? (
          <ActivitiesBoard tripId={trip.id} currentMemberId={user.memberId} />
        ) : null}
      </section>
    </main>
  );
}

async function ActivitiesBoard({
  tripId,
  currentMemberId,
}: {
  tripId: string;
  currentMemberId: string;
}) {
  const rows = await prisma.activity.findMany({
    where: { tripId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      note: true,
      url: true,
      authorId: true,
      author: { select: { name: true, email: true, accentColor: true } },
    },
  });
  const activities = buildActivitiesView(rows, currentMemberId);

  return (
    <>
      <div className="mt-8 rounded-2xl border border-line bg-stage-raised p-6">
        <h2 className="font-serif text-2xl">Add something to do</h2>
        <p className="mt-1 text-sm text-ink-dim">
          A title is all you need; a note and a link are optional.
        </p>
        <div className="mt-4">
          <AddActivityForm />
        </div>
      </div>

      <div className="mt-6">
        {activities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-stage-raised/50 p-10 text-center">
            <p className="text-ink-dim">
              Nothing on the list yet — add the first thing to do.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function ActivityItem({ activity }: { activity: ActivityCard }) {
  return (
    <li className="rounded-2xl border border-line bg-stage-raised p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-xl font-bold">{activity.title}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-ink-dim">
            <Avatar initials={activity.initials} accent={activity.accent} />
            <span className="truncate">{activity.authorName}</span>
          </div>
        </div>
        {activity.canDelete && (
          <form action={deleteActivity}>
            <input type="hidden" name="activityId" value={activity.id} />
            <button
              type="submit"
              className="shrink-0 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-stage"
            >
              Remove
            </button>
          </form>
        )}
      </div>

      {activity.note && (
        <p className="mt-3 whitespace-pre-line text-sm text-ink">{activity.note}</p>
      )}

      {activity.url && (
        <a
          href={activity.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-dim transition-colors hover:text-ink"
        >
          <span aria-hidden>🔗</span>
          <span className="truncate">{activity.linkHost ?? "Link"}</span>
        </a>
      )}
    </li>
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
