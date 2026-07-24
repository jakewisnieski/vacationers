import { describe, expect, it } from "vitest";
import {
  buildCommentsView,
  parseCommentInput,
  type CommentRow,
  COMMENT_BODY_MAX,
} from "./comments";

describe("parseCommentInput", () => {
  it("trims and accepts a non-empty body", () => {
    const result = parseCommentInput({ body: "  Love this idea  " });
    expect(result).toEqual({ ok: true, value: { body: "Love this idea" } });
  });

  it.each(["", "   "])("rejects a blank body %j", (body) => {
    const result = parseCommentInput({ body });
    expect(result.ok).toBe(false);
  });

  it("rejects an over-long body", () => {
    const result = parseCommentInput({ body: "x".repeat(COMMENT_BODY_MAX + 1) });
    expect(result.ok).toBe(false);
  });

  it("accepts a body exactly at the cap", () => {
    const result = parseCommentInput({ body: "x".repeat(COMMENT_BODY_MAX) });
    expect(result.ok).toBe(true);
  });
});

describe("buildCommentsView", () => {
  const me = "member-1";
  const rows: CommentRow[] = [
    {
      id: "c1",
      body: "Ring road looks amazing",
      authorId: me,
      author: { name: "Jake", email: "jake@example.com", accentColor: "#38bdf8" },
    },
    {
      id: "c2",
      body: "Count me in",
      authorId: "member-2",
      author: { name: null, email: "amy@example.com", accentColor: null },
    },
    {
      id: "c3",
      body: "Orphaned",
      authorId: null,
      author: null,
    },
  ];

  it("lets the author delete their own comment, but no one else's", () => {
    const [mine, theirs, orphan] = buildCommentsView(rows, me);
    expect(mine.canDelete).toBe(true);
    expect(theirs.canDelete).toBe(false);
    expect(orphan.canDelete).toBe(false);
  });

  it("resolves author name from name, else the email local-part", () => {
    const [mine, theirs] = buildCommentsView(rows, me);
    expect(mine.authorName).toBe("Jake");
    expect(theirs.authorName).toBe("amy");
  });

  it("labels an author-less (removed member) comment as Someone", () => {
    const [, , orphan] = buildCommentsView(rows, me);
    expect(orphan.authorName).toBe("Someone");
  });

  it("carries the body through unchanged and preserves row order", () => {
    const cards = buildCommentsView(rows, me);
    expect(cards.map((c) => c.body)).toEqual([
      "Ring road looks amazing",
      "Count me in",
      "Orphaned",
    ]);
  });

  it("uses the explicit accentColor when set, else a stable fallback", () => {
    const [mine, theirs] = buildCommentsView(rows, me);
    expect(mine.accent).toBe("#38bdf8");
    expect(theirs.accent).toBe(buildCommentsView(rows, me)[1].accent);
    expect(theirs.accent).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
