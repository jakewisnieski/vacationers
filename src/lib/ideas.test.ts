import { describe, expect, it } from "vitest";
import {
  buildIdeasView,
  isValidUrl,
  parseIdeaInput,
  type IdeaRow,
  IDEA_TITLE_MAX,
  IDEA_DESCRIPTION_MAX,
} from "./ideas";

describe("parseIdeaInput", () => {
  it("accepts a title-only idea, collapsing blank optionals to null", () => {
    const result = parseIdeaInput({ title: "  Reykjavík  ", description: " ", url: "" });
    expect(result).toEqual({
      ok: true,
      value: { title: "Reykjavík", description: null, url: null },
    });
  });

  it("trims and keeps description + a valid link", () => {
    const result = parseIdeaInput({
      title: "Blue Lagoon week",
      description: "  Geothermal spa near the airport  ",
      url: " https://www.bluelagoon.com/ ",
    });
    expect(result).toEqual({
      ok: true,
      value: {
        title: "Blue Lagoon week",
        description: "Geothermal spa near the airport",
        url: "https://www.bluelagoon.com/",
      },
    });
  });

  it.each(["", "   "])("rejects a blank title %j", (title) => {
    const result = parseIdeaInput({ title, description: "", url: "" });
    expect(result.ok).toBe(false);
  });

  it("rejects an over-long title", () => {
    const result = parseIdeaInput({
      title: "x".repeat(IDEA_TITLE_MAX + 1),
      description: "",
      url: "",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an over-long description", () => {
    const result = parseIdeaInput({
      title: "ok",
      description: "x".repeat(IDEA_DESCRIPTION_MAX + 1),
      url: "",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a malformed link", () => {
    const result = parseIdeaInput({
      title: "ok",
      description: "",
      url: "not a url",
    });
    expect(result.ok).toBe(false);
  });
});

describe("isValidUrl", () => {
  it.each(["https://example.com", "http://a.b/c?d=e"])(
    "accepts %j",
    (url) => expect(isValidUrl(url)).toBe(true),
  );

  it.each(["", "example.com", "ftp://example.com", "javascript:alert(1)", "nope"])(
    "rejects %j",
    (url) => expect(isValidUrl(url)).toBe(false),
  );
});

describe("buildIdeasView", () => {
  const me = "member-1";
  const rows: IdeaRow[] = [
    {
      id: "i1",
      title: "Reykjavík",
      description: "Ring road",
      url: "https://www.roadtrip.is/loop",
      authorId: me,
      author: { name: "Jake", email: "jake@example.com", accentColor: "#38bdf8" },
    },
    {
      id: "i2",
      title: "Lisbon",
      description: null,
      url: null,
      authorId: "member-2",
      author: { name: null, email: "amy@example.com", accentColor: null },
    },
    {
      id: "i3",
      title: "Kyoto (imported)",
      description: null,
      url: null,
      authorId: null,
      author: null,
    },
  ];

  it("lets the author delete their own idea, but no one else's", () => {
    const [mine, theirs, imported] = buildIdeasView(rows, me);
    expect(mine.canDelete).toBe(true);
    expect(theirs.canDelete).toBe(false);
    expect(imported.canDelete).toBe(false);
  });

  it("resolves author name from name, else email local-part", () => {
    const [mine, theirs] = buildIdeasView(rows, me);
    expect(mine.authorName).toBe("Jake");
    expect(theirs.authorName).toBe("amy");
  });

  it("labels an author-less (imported) idea as Suggested", () => {
    const [, , imported] = buildIdeasView(rows, me);
    expect(imported.authorName).toBe("Suggested");
  });

  it("derives a bare link host and drops www", () => {
    const [mine, theirs] = buildIdeasView(rows, me);
    expect(mine.linkHost).toBe("roadtrip.is");
    expect(theirs.linkHost).toBeNull();
  });

  it("uses the explicit accentColor when set, else a stable fallback", () => {
    const [mine, theirs] = buildIdeasView(rows, me);
    expect(mine.accent).toBe("#38bdf8");
    // No accentColor → deterministic palette slot (same across runs).
    expect(theirs.accent).toBe(buildIdeasView(rows, me)[1].accent);
    expect(theirs.accent).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
