import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Runs the DB check at request time, never at build time.
export const dynamic = "force-dynamic";

/** Liveness + DB connectivity probe. Proves the Neon connection (#11). */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "up" });
  } catch (error) {
    // Log the detail server-side; don't leak DB host/port to callers of this
    // public, unauthenticated probe.
    console.error("health: db check failed", error);
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
