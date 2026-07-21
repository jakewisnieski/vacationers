import { describe, expect, it } from "vitest";
import { buildRosterView, isValidEmail, normalizeEmail } from "./roster";

describe("normalizeEmail", () => {
  it("trims surrounding whitespace and lowercases", () => {
    expect(normalizeEmail("  Jake@Example.COM ")).toBe("jake@example.com");
  });
});

describe("isValidEmail", () => {
  it("accepts a plain address", () => {
    expect(isValidEmail("jake@example.com")).toBe(true);
  });

  it.each(["", "jake", "jake@", "@example.com", "jake@example", "a b@c.com"])(
    "rejects %j",
    (bad) => {
      expect(isValidEmail(bad)).toBe(false);
    },
  );
});

describe("buildRosterView", () => {
  const members = [
    { email: "jake@example.com", name: "Jake", isOwner: true },
    { email: "amy@example.com", name: "Amy", isOwner: false },
  ];
  const allowlist = [
    { email: "jake@example.com" },
    { email: "amy@example.com" },
    { email: "newfriend@example.com" }, // invited, never signed in
  ];

  it("lists members owner-first, each tagged allowlisted", () => {
    const { members: rows } = buildRosterView(members, allowlist);
    expect(rows.map((r) => r.email)).toEqual([
      "jake@example.com",
      "amy@example.com",
    ]);
    expect(rows[0].isOwner).toBe(true);
    expect(rows.every((r) => r.allowlisted)).toBe(true);
  });

  it("flags a member whose invite was revoked as not allowlisted", () => {
    const { members: rows } = buildRosterView(members, [
      { email: "jake@example.com" },
    ]);
    const amy = rows.find((r) => r.email === "amy@example.com");
    expect(amy?.allowlisted).toBe(false);
  });

  it("surfaces allowlisted-but-never-signed-in emails as pending", () => {
    const { pending } = buildRosterView(members, allowlist);
    expect(pending.map((p) => p.email)).toEqual(["newfriend@example.com"]);
  });

  it("matches emails case-insensitively (citext parity)", () => {
    const { members: rows, pending } = buildRosterView(
      [{ email: "Amy@Example.com", name: "Amy", isOwner: false }],
      [{ email: "amy@example.com" }],
    );
    expect(rows[0].allowlisted).toBe(true);
    expect(pending).toEqual([]);
  });
});
