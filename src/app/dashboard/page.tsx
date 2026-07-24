import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildDashboardView, initialsFor } from "@/lib/dashboard";

// The north-star trip dashboard (#15): a logged-in member lands here on the
// current / most-recent trip, with the big-three (destination · dates · who's
// in) as hero cards over the Electric Dusk hero, in the Wanderlust · Nightfall
// visual (#9). Later milestones fill the stubbed regions (status band,
// needs-your-input, activity feed, checklist).

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;
  if (!user) redirect("/");

  // The current trip is the most-recent by year (past trips accrue, #5).
  const trip = await prisma.trip.findFirst({
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    include: {
      participants: {
        include: {
          member: { select: { name: true, email: true, accentColor: true } },
        },
      },
    },
  });

  return (
    <main className="flex-1">
      <TopBar
        name={user.name ?? user.email ?? "You"}
        email={user.email ?? ""}
        isOwner={Boolean(user.isOwner)}
      />
      {trip ? <TripDashboard view={buildDashboardView(trip)} /> : <NoTrip />}
    </main>
  );
}

function TopBar({
  name,
  email,
  isOwner,
}: {
  name: string;
  email: string;
  isOwner: boolean;
}) {
  return (
    <header className="flex items-center justify-between px-4 py-4 sm:px-6">
      <span className="font-serif text-xl font-bold">
        Vacation<span className="text-action">ers</span>
      </span>
      <div className="flex items-center gap-3">
        <Link
          href="/ideas"
          className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-stage-raised"
        >
          Ideas
        </Link>
        <Link
          href="/activities"
          className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-stage-raised"
        >
          Things to do
        </Link>
        <Link
          href="/polls"
          className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-stage-raised"
        >
          Polls
        </Link>
        {isOwner && (
          <Link
            href="/roster"
            className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-stage-raised"
          >
            Roster
          </Link>
        )}
        <Avatar
          initials={initialsFor(name, email)}
          accent="var(--accent-1)"
          size={32}
        />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-stage-raised"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

function TripDashboard({
  view,
}: {
  view: ReturnType<typeof buildDashboardView>;
}) {
  return (
    // Full-bleed: the hero and big-three span the viewport (only a gutter),
    // matching the prototype — not caged in a narrow centered column.
    <div className="px-4 pb-20 sm:px-6">
      {/* Electric Dusk hero band with the floating crew (#9). */}
      <section className="hero-dusk relative overflow-hidden rounded-3xl px-8 pb-24 pt-9 text-white shadow-2xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_240px_at_85%_-20%,rgba(255,255,255,0.28),transparent)]"
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/85">
            {view.kicker}
          </p>
          <h1 className="mt-1.5 font-serif text-4xl font-bold sm:text-5xl">
            {view.title}
          </h1>
          <div className="mt-5 flex items-center">
            {view.crew.map((m, i) => (
              <div key={`${m.name}-${i}`} className={i > 0 ? "-ml-1.5" : ""}>
                <Avatar
                  initials={m.initials}
                  accent={m.accent}
                  size={32}
                  ring
                  presence
                />
              </div>
            ))}
            {view.crew.length === 0 && (
              <span className="text-sm text-white/80">
                No one&apos;s joined this trip yet.
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Big-three hero cards, floating up over the hero band. `relative z-10`
          lifts them above the (positioned) hero so its gradient box doesn't
          paint over their top edge where they overlap. */}
      <section className="relative z-10 -mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Big3Card
          icon="📍"
          label="Destination"
          value={view.destination.value}
          sub={
            view.destination.known
              ? "Set for this trip"
              : "Pitch ideas on the board →"
          }
          variant="dest"
          filled={view.destination.known}
        />
        <Big3Card
          icon="🗓️"
          label="Dates"
          value={view.dates.value}
          sub={
            view.dates.known
              ? "Planned for this trip"
              : "Date-finding opens in a later slice"
          }
          variant="dates"
          filled={view.dates.known}
        />
        <Big3Card
          icon="🧑‍🤝‍🧑"
          label="Who's in"
          value={view.whosIn.label}
          sub={view.whosIn.names || "Invites open in a later slice"}
          variant="crew"
          filled={view.whosIn.count > 0}
        />
      </section>

      {/* Stubbed regions — filled by the v0.2 / v0.4 milestones (#15). */}
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StubPanel title="Your move" emoji="✅">
          Tasks that need you — votes, polls, and reservations — will surface
          here once those slices land.
        </StubPanel>
        <StubPanel title="Around the campfire" emoji="💬">
          The activity feed — ideas, votes, and comments from the group — lands
          with the ideas board.
        </StubPanel>
        <StubPanel title="Checklist" emoji="📋">
          Trip checklist progress will track here as tasks get assigned and
          checked off.
        </StubPanel>
        <StubPanel title="Trip status" emoji="🧭">
          Destination voting and date-overlap progress will show here as the
          group weighs in.
        </StubPanel>
      </section>
    </div>
  );
}

function NoTrip() {
  return (
    <div className="px-4 pb-20 sm:px-6">
      <section className="hero-dusk relative overflow-hidden rounded-3xl px-8 py-16 text-center text-white shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/85">
          The annual trip
        </p>
        <h1 className="mt-1.5 font-serif text-4xl font-bold sm:text-5xl">
          No trip yet
        </h1>
        <p className="mx-auto mt-3 max-w-md text-white/85">
          Once a trip is created for this year, its destination, dates, and
          who&apos;s in will land right here.
        </p>
      </section>
    </div>
  );
}

// Per-card accent bars, echoing the prototype's status bars (#9). Their fill
// currently reflects only whether the datum is *set* (full when known, empty
// when not) — a placeholder for the richer vote / date-overlap / attendance
// progress the v0.2 / v0.4 slices will drive.
const BAR_GRADIENTS = {
  dest: "linear-gradient(90deg, var(--dusk-2), var(--dusk-3))",
  dates: "linear-gradient(90deg, var(--action), var(--accent-1))",
  crew: "linear-gradient(90deg, var(--accent-4), var(--accent-1))",
} as const;

function Big3Card({
  icon,
  label,
  value,
  sub,
  variant,
  filled,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  variant: keyof typeof BAR_GRADIENTS;
  filled: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-stage-raised p-5 shadow-xl">
      <div className="text-xl">{icon}</div>
      <div className="mt-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink-dim">
        {label}
      </div>
      <div className="mt-1 font-serif text-2xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-ink-dim">{sub}</div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full"
          style={{
            width: filled ? "100%" : "0%",
            background: BAR_GRADIENTS[variant],
          }}
        />
      </div>
    </div>
  );
}

function StubPanel({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-stage-raised p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold">{title}</h2>
        <span className="text-lg" aria-hidden>
          {emoji}
        </span>
      </div>
      <p className="mt-3 text-sm text-ink-dim">{children}</p>
      <span className="mt-4 inline-block rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-ink-dim">
        Coming soon
      </span>
    </div>
  );
}

function Avatar({
  initials,
  accent,
  size,
  ring = false,
  presence = false,
}: {
  initials: string;
  accent: string;
  size: number;
  ring?: boolean;
  presence?: boolean;
}) {
  return (
    <span
      className={`relative inline-grid place-items-center rounded-full font-semibold text-white ${
        ring ? "ring-2 ring-white/50" : ""
      }`}
      style={{
        width: size,
        height: size,
        background: accent,
        fontSize: size * 0.36,
      }}
    >
      {initials}
      {presence && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent-4 ring-2 ring-[var(--dusk-2)]" />
      )}
    </span>
  );
}
