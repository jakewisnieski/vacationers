import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Owner bootstrap (#5): the one privileged account the group starts from.
// Overridable for other environments; defaults to Jake's account.
// `||` (not `??`) so a blank OWNER_EMAIL="" also falls back to the default.
const OWNER_EMAIL = process.env.OWNER_EMAIL || "jakewisnieski@gmail.com";

// The Nightfall per-member accent slots (#9), mirrored from globals.css. Inlined
// (not imported) so the seed runner has no dependency on the app's path aliases.
const ACCENTS = {
  blue: "#38bdf8",
  purple: "#a78bfa",
  pink: "#fb7185",
  green: "#34d399",
};

async function main() {
  // Admit the owner on the DB-authoritative allowlist, then materialize the
  // owner Member. Upserts keep this idempotent — re-seeding is safe.
  await prisma.allowlistEntry.upsert({
    where: { email: OWNER_EMAIL },
    update: {},
    create: { email: OWNER_EMAIL },
  });

  const owner = await prisma.member.upsert({
    where: { email: OWNER_EMAIL },
    update: { isOwner: true, accentColor: ACCENTS.blue },
    create: { email: OWNER_EMAIL, isOwner: true, accentColor: ACCENTS.blue },
  });

  console.log(`Seeded owner: ${owner.email} (isOwner=${owner.isOwner})`);

  // Demo data for the dashboard walking skeleton (#15): a current-year Trip with
  // a handful of participants, so the dashboard renders a real Trip + who's-in
  // (not hardcoded). These demo friends are deliberately NOT added to the
  // allowlist, so they can't sign in — they're display-only rows the owner can
  // clear once real members join. Everything below is idempotent.
  const demoFriends = [
    { email: "mike@example.com", name: "Mike", accentColor: ACCENTS.green },
    { email: "chris@example.com", name: "Chris", accentColor: ACCENTS.pink },
    { email: "dan@example.com", name: "Dan", accentColor: ACCENTS.purple },
  ];

  const friends = await Promise.all(
    demoFriends.map((f) =>
      prisma.member.upsert({
        where: { email: f.email },
        update: { name: f.name, accentColor: f.accentColor },
        create: f,
      }),
    ),
  );

  // One trip per year (#5) — find-or-create by year so re-seeding is safe.
  const year = new Date().getFullYear();
  const existingTrip = await prisma.trip.findFirst({ where: { year } });
  const trip =
    existingTrip ??
    (await prisma.trip.create({
      data: {
        year,
        // Placeholder demo values — the owner can change these in-app once the
        // ideas board and date-finding slices land.
        destination: "Nashville",
        startDate: new Date(Date.UTC(year, 9, 9)), // Oct 9
        endDate: new Date(Date.UTC(year, 9, 12)), // Oct 12
        status: "planning",
      },
    }));

  for (const member of [owner, ...friends]) {
    await prisma.tripParticipant.upsert({
      where: { tripId_memberId: { tripId: trip.id, memberId: member.id } },
      update: {},
      create: { tripId: trip.id, memberId: member.id },
    });
  }

  console.log(
    `Seeded demo trip ${trip.year} (${trip.destination}) with ${
      friends.length + 1
    } participants`,
  );

  // Demo destination ideas for the ideas board (#26), authored by the
  // display-only demo friends — so the board renders with real attribution and
  // the owner can see ideas they can't delete (author-only removal). Idempotent:
  // find-or-create by (trip, title).
  const demoIdeas = [
    {
      title: "Reykjavík, Iceland",
      authorId: friends[0].id,
      description: "Ring road + Blue Lagoon; cheap shoulder-season flights.",
      url: "https://www.roadtrip.is",
    },
    {
      title: "Lisbon, Portugal",
      authorId: friends[1].id,
      description: "Warm in October, great food, easy to get around.",
      url: null as string | null,
    },
  ];
  for (const idea of demoIdeas) {
    const exists = await prisma.idea.findFirst({
      where: { tripId: trip.id, title: idea.title },
    });
    if (!exists) {
      await prisma.idea.create({ data: { tripId: trip.id, ...idea } });
    }
  }

  console.log(`Seeded ${demoIdeas.length} demo destination ideas`);

  // Demo upvotes (#28) so the board shows counts and the most-voted sort out of
  // the box — Reykjavík out-votes Lisbon. Idempotent via the unique (idea,
  // member) key; find the idea by title so this doesn't depend on create order.
  const demoVotes = [
    {
      title: "Reykjavík, Iceland",
      memberIds: [owner.id, friends[1].id, friends[2].id],
    },
    { title: "Lisbon, Portugal", memberIds: [owner.id] },
  ];
  for (const { title, memberIds } of demoVotes) {
    const idea = await prisma.idea.findFirst({
      where: { tripId: trip.id, title },
    });
    if (!idea) continue;
    for (const memberId of memberIds) {
      await prisma.ideaVote.upsert({
        where: { ideaId_memberId: { ideaId: idea.id, memberId } },
        update: {},
        create: { ideaId: idea.id, memberId },
      });
    }
  }

  console.log("Seeded demo idea votes");

  // Demo things-to-do for the activities board (#27), authored by the
  // display-only demo friends — so the board renders with real attribution.
  // Idempotent: find-or-create by (trip, title).
  const demoActivities = [
    {
      title: "Snorkel Silfra",
      authorId: friends[0].id,
      note: "Drysuit dive between the tectonic plates — book ahead.",
      url: "https://www.dive.is/silfra" as string | null,
    },
    {
      title: "Golden Circle day trip",
      authorId: friends[2].id,
      note: "Þingvellir, Geysir, Gullfoss — rent a car for the day.",
      url: null as string | null,
    },
  ];
  for (const activity of demoActivities) {
    const exists = await prisma.activity.findFirst({
      where: { tripId: trip.id, title: activity.title },
    });
    if (!exists) {
      await prisma.activity.create({ data: { tripId: trip.id, ...activity } });
    }
  }

  console.log(`Seeded ${demoActivities.length} demo activities`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
