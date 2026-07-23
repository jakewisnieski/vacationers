import { describe, expect, it } from "vitest";
import {
  buildActivitiesView,
  parseActivityInput,
  type ActivityRow,
  ACTIVITY_TITLE_MAX,
  ACTIVITY_NOTE_MAX,
  ACTIVITY_URL_MAX,
} from "./activities";

describe("parseActivityInput", () => {
  it("accepts a title-only activity, collapsing blank optionals to null", () => {
    const result = parseActivityInput({ title: "  Snorkeling  ", note: " ", url: "" });
    expect(result).toEqual({
      ok: true,
      value: { title: "Snorkeling", note: null, url: null },
    });
  });

  it("trims and keeps note + a valid link", () => {
    const result = parseActivityInput({
      title: "Hike the ring road",
      note: "  Full-day, bring layers  ",
      url: " https://www.roadtrip.is/loop ",
    });
    expect(result).toEqual({
      ok: true,
      value: {
        title: "Hike the ring road",
        note: "Full-day, bring layers",
        url: "https://www.roadtrip.is/loop",
      },
    });
  });

  it.each(["", "   "])("rejects a blank title %j", (title) => {
    const result = parseActivityInput({ title, note: "", url: "" });
    expect(result.ok).toBe(false);
  });

  it("rejects an over-long title", () => {
    const result = parseActivityInput({
      title: "x".repeat(ACTIVITY_TITLE_MAX + 1),
      note: "",
      url: "",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an over-long note", () => {
    const result = parseActivityInput({
      title: "ok",
      note: "x".repeat(ACTIVITY_NOTE_MAX + 1),
      url: "",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a malformed link", () => {
    const result = parseActivityInput({ title: "ok", note: "", url: "not a url" });
    expect(result.ok).toBe(false);
  });

  it("rejects an over-long link", () => {
    const result = parseActivityInput({
      title: "ok",
      note: "",
      url: `https://example.com/${"x".repeat(ACTIVITY_URL_MAX)}`,
    });
    expect(result.ok).toBe(false);
  });
});

describe("buildActivitiesView", () => {
  const me = "member-1";
  const rows: ActivityRow[] = [
    {
      id: "a1",
      title: "Snorkel Silfra",
      note: "Between two continents",
      url: "https://www.dive.is/silfra",
      authorId: me,
      author: { name: "Jake", email: "jake@example.com", accentColor: "#38bdf8" },
    },
    {
      id: "a2",
      title: "Food tour",
      note: null,
      url: null,
      authorId: "member-2",
      author: { name: null, email: "amy@example.com", accentColor: null },
    },
    {
      id: "a3",
      title: "Orphaned activity",
      note: null,
      url: null,
      authorId: null,
      author: null,
    },
  ];

  it("lets the author delete their own activity, but no one else's", () => {
    const [mine, theirs, orphan] = buildActivitiesView(rows, me);
    expect(mine.canDelete).toBe(true);
    expect(theirs.canDelete).toBe(false);
    expect(orphan.canDelete).toBe(false);
  });

  it("resolves author name from name, else email local-part", () => {
    const [mine, theirs] = buildActivitiesView(rows, me);
    expect(mine.authorName).toBe("Jake");
    expect(theirs.authorName).toBe("amy");
  });

  it("labels an author-less (removed member) activity as Someone", () => {
    const [, , orphan] = buildActivitiesView(rows, me);
    expect(orphan.authorName).toBe("Someone");
  });

  it("derives a bare link host and drops www", () => {
    const [mine, theirs] = buildActivitiesView(rows, me);
    expect(mine.linkHost).toBe("dive.is");
    expect(theirs.linkHost).toBeNull();
  });

  it("drops a non-http(s) stored URL so it never becomes a link", () => {
    const [card] = buildActivitiesView(
      [{ ...rows[0], url: "javascript:alert(1)" }],
      me,
    );
    expect(card.url).toBeNull();
    expect(card.linkHost).toBeNull();
  });
});
