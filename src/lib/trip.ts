import { prisma } from "@/lib/prisma";

// The "current" trip is the most-recent by year (past trips accrue, #5). The
// app has a single active trip today — no picker yet — so the dashboard and the
// planning surfaces (ideas board #26, and later activities/polls) all resolve
// the trip the same way through here.
export function getCurrentTrip() {
  return prisma.trip.findFirst({
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
  });
}
