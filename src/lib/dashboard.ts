// Pure dashboard view-model — no I/O, so the big-three shaping, avatar
// initials, accent assignment, and date formatting can be unit-tested without a
// database (#15). The server component queries the current / most-recent Trip
// with its participants and hands the raw rows here; this folds them into the
// north-star dashboard's big-three (destination · dates · who's in) and the
// crew, assigning each member a Nightfall accent (#9).

/**
 * The four per-member accent slots from the Nightfall palette (#9), mirrored
 * from `globals.css` (`--accent-1..4`). Used as a deterministic fallback when a
 * Member has no explicit `accentColor` yet.
 */
export const NIGHTFALL_ACCENTS = [
  "#38bdf8",
  "#a78bfa",
  "#fb7185",
  "#34d399",
] as const;

export type TripStatus = "planning" | "locked" | "completed" | "archived";

type MemberInput = {
  name: string | null;
  email: string;
  accentColor: string | null;
};

type ParticipantInput = {
  joinedAt: Date;
  member: MemberInput;
};

/** The raw shape the page pulls from Prisma — just the fields the view needs. */
export type TripInput = {
  year: number;
  destination: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: TripStatus;
  participants: ParticipantInput[];
};

export type CrewMember = {
  /** Display name — the member's name, or the local-part of their email. */
  name: string;
  /** Two-character avatar initials. */
  initials: string;
  /** Resolved hex accent (explicit `accentColor`, else a palette fallback). */
  accent: string;
};

/** One of the big-three facts; `known` distinguishes a real value from a stub. */
type Fact = { value: string; known: boolean };

export type DashboardView = {
  /** Hero title, e.g. "The 2026 Trip". */
  title: string;
  /** Hero kicker, e.g. "The annual trip · Planning". */
  kicker: string;
  status: TripStatus;
  destination: Fact;
  dates: Fact;
  whosIn: {
    count: number;
    /** e.g. "3 going" or "No one yet". */
    label: string;
    /** e.g. "Jake · Mike · Chris". */
    names: string;
  };
  crew: CrewMember[];
};

/** The member's name if set, else the local-part of their email. */
export function displayName(name: string | null, email: string): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return email.split("@")[0] || email;
}

/** Two-character initials from a name ("Jake Wisnieski" → "JW") or email. */
export function initialsFor(name: string | null, email: string): string {
  const source = displayName(name, email).trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

// Dates are stored as `@db.Date` and read back as UTC-midnight Date objects, so
// format in UTC — otherwise a negative local offset rolls the day backwards.
function monthShort(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
  }).format(d);
}

/**
 * A human date range without the year (the hero already carries it):
 * "Oct 9–12" within a month, "Oct 30 – Nov 2" across months, "Oct 9" when only
 * one bound is known, "" when neither is.
 */
export function formatDateRange(start: Date | null, end: Date | null): string {
  if (start && end) {
    const startMonth = monthShort(start);
    const endMonth = monthShort(end);
    if (startMonth === endMonth && start.getUTCFullYear() === end.getUTCFullYear()) {
      return `${startMonth} ${start.getUTCDate()}–${end.getUTCDate()}`;
    }
    return `${startMonth} ${start.getUTCDate()} – ${endMonth} ${end.getUTCDate()}`;
  }
  const single = start ?? end;
  return single ? `${monthShort(single)} ${single.getUTCDate()}` : "";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Fold a Trip + its participants into the dashboard's north-star view. */
export function buildDashboardView(trip: TripInput): DashboardView {
  const crew: CrewMember[] = [...trip.participants]
    // Stable, join-order crew so accent slots are deterministic run to run.
    .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())
    .map((p, i) => ({
      name: displayName(p.member.name, p.member.email),
      initials: initialsFor(p.member.name, p.member.email),
      accent:
        p.member.accentColor ??
        NIGHTFALL_ACCENTS[i % NIGHTFALL_ACCENTS.length],
    }));

  const dateStr = formatDateRange(trip.startDate, trip.endDate);

  return {
    title: `The ${trip.year} Trip`,
    kicker: `The annual trip · ${capitalize(trip.status)}`,
    status: trip.status,
    destination: {
      value: trip.destination ?? "TBD",
      known: Boolean(trip.destination),
    },
    dates: { value: dateStr || "TBD", known: dateStr !== "" },
    whosIn: {
      count: crew.length,
      label: crew.length === 0 ? "No one yet" : `${crew.length} going`,
      names: crew.map((c) => c.name).join(" · "),
    },
    crew,
  };
}
