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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
