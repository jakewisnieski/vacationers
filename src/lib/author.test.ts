import { describe, expect, it } from "vitest";
import { accentForSeed, presentAuthor, type AuthorInput } from "./author";

const me = "member-1";
const absent = { name: "Someone", initials: "?" };

describe("accentForSeed", () => {
  it("is deterministic for a given seed", () => {
    expect(accentForSeed("jake@example.com")).toBe(accentForSeed("jake@example.com"));
  });

  it("returns a hex from the Nightfall palette", () => {
    expect(accentForSeed("amy@example.com")).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("presentAuthor", () => {
  const jake: AuthorInput = {
    name: "Jake",
    email: "jake@example.com",
    accentColor: "#38bdf8",
  };
  const amy: AuthorInput = { name: null, email: "amy@example.com", accentColor: null };

  it("lets the current member delete their own row, no one else's", () => {
    expect(presentAuthor(jake, me, me, absent).canDelete).toBe(true);
    expect(presentAuthor(amy, "member-2", me, absent).canDelete).toBe(false);
  });

  it("resolves name from name, else the email local-part", () => {
    expect(presentAuthor(jake, me, me, absent).authorName).toBe("Jake");
    expect(presentAuthor(amy, "member-2", me, absent).authorName).toBe("amy");
  });

  it("uses the explicit accentColor when set, else a stable seed fallback", () => {
    expect(presentAuthor(jake, me, me, absent).accent).toBe("#38bdf8");
    const first = presentAuthor(amy, "member-2", me, absent).accent;
    expect(first).toBe(accentForSeed("amy@example.com"));
    expect(first).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("falls back to the caller's absent label + a neutral accent, never deletable", () => {
    const p = presentAuthor(null, null, me, absent);
    expect(p.authorName).toBe("Someone");
    expect(p.initials).toBe("?");
    expect(p.accent).toBe("#9aa3c0");
    expect(p.canDelete).toBe(false);
  });
});
