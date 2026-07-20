import { PrismaClient } from "@prisma/client";

// Single PrismaClient across hot-reloads in dev (avoids exhausting DB
// connections). In production a fresh client per lambda is fine.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
