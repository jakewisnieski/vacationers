import { describe, expect, it } from "vitest";
import {
  buildDashboardView,
  displayName,
  formatDateRange,
  initialsFor,
  NIGHTFALL_ACCENTS,
  type TripInput,
} from "./dashboard";

// UTC-midnight dates, mirroring how `@db.Date` columns read back.
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

describe("displayName", () => {
  it("prefers the name", () => {
    expect(displayName("Jake", "jake@example.com")).toBe("Jake");
  });

  it("falls back to the email local-part when name is blank/null", () => {
    expect(displayName(null, "jake@example.com")).toBe("jake");
    expect(displayName("   ", "amy@example.com")).toBe("amy");
  });
});

describe("initialsFor", () => {
  it("takes first + last initial of a full name", () => {
    expect(initialsFor("Jake Wisnieski", "x@y.com")).toBe("JW");
  });

  it("takes the first two letters of a single name", () => {
    expect(initialsFor("Dan", "x@y.com")).toBe("DA");
  });

  it("derives from the email when there is no name", () => {
    expect(initialsFor(null, "chris@example.com")).toBe("CH");
  });
});

describe("formatDateRange", () => {
  it("collapses a same-month range", () => {
    expect(formatDateRange(utc(2026, 9, 9), utc(2026, 9, 12))).toBe("Oct 9–12");
  });

  it("spells out a cross-month range", () => {
    expect(formatDateRange(utc(2026, 9, 30), utc(2026, 10, 2))).toBe(
      "Oct 30 – Nov 2",
    );
  });

  it("formats in UTC so the day never rolls backwards", () => {
    expect(formatDateRange(utc(2026, 0, 1), null)).toBe("Jan 1");
  });

  it("returns empty when neither bound is known", () => {
    expect(formatDateRange(null, null)).toBe("");
  });
});

describe("buildDashboardView", () => {
  const base: TripInput = {
    year: 2026,
    destination: "Nashville",
    startDate: utc(2026, 9, 9),
    endDate: utc(2026, 9, 12),
    status: "planning",
    participants: [
      {
        joinedAt: utc(2026, 0, 2),
        member: { name: "Mike", email: "mike@example.com", accentColor: null },
      },
      {
        joinedAt: utc(2026, 0, 1),
        member: {
          name: "Jake",
          email: "jake@example.com",
          accentColor: "#38bdf8",
        },
      },
    ],
  };

  it("shapes the big-three from real trip data", () => {
    const view = buildDashboardView(base);
    expect(view.title).toBe("The 2026 Trip");
    expect(view.kicker).toBe("The annual trip · Planning");
    expect(view.destination).toEqual({ value: "Nashville", known: true });
    expect(view.dates).toEqual({ value: "Oct 9–12", known: true });
    expect(view.whosIn.count).toBe(2);
    expect(view.whosIn.label).toBe("2 going");
  });

  it("orders the crew by join time and names them in that order", () => {
    const view = buildDashboardView(base);
    // Jake joined first (Jan 1) despite being listed second.
    expect(view.crew.map((c) => c.name)).toEqual(["Jake", "Mike"]);
    expect(view.whosIn.names).toBe("Jake · Mike");
  });

  it("keeps an explicit accent and assigns palette slots to the rest", () => {
    const view = buildDashboardView(base);
    expect(view.crew[0].accent).toBe("#38bdf8"); // Jake's explicit accent
    expect(view.crew[1].accent).toBe(NIGHTFALL_ACCENTS[1]); // Mike, 2nd slot
  });

  it("stubs the big-three and reports an empty crew when nothing is set", () => {
    const view = buildDashboardView({
      year: 2027,
      destination: null,
      startDate: null,
      endDate: null,
      status: "planning",
      participants: [],
    });
    expect(view.destination).toEqual({ value: "TBD", known: false });
    expect(view.dates).toEqual({ value: "TBD", known: false });
    expect(view.whosIn).toEqual({ count: 0, label: "No one yet", names: "" });
    expect(view.crew).toEqual([]);
  });
});
