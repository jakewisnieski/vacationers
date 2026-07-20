import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Owner bootstrap (#5): the one privileged account the group starts from.
// Overridable for other environments; defaults to Jake's account.
// `||` (not `??`) so a blank OWNER_EMAIL="" also falls back to the default.
const OWNER_EMAIL = process.env.OWNER_EMAIL || "jakewisnieski@gmail.com";

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
    update: { isOwner: true },
    create: { email: OWNER_EMAIL, isOwner: true },
  });

  console.log(`Seeded owner: ${owner.email} (isOwner=${owner.isOwner})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
