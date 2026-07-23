import { describe, expect, it } from "vitest";
import { hostOf, isValidUrl } from "./url";

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

describe("hostOf", () => {
  it("returns the bare host and drops a leading www.", () => {
    expect(hostOf("https://www.roadtrip.is/loop")).toBe("roadtrip.is");
    expect(hostOf("https://airbnb.com/rooms/1")).toBe("airbnb.com");
  });

  it("returns null for an unparseable value", () => {
    expect(hostOf("not a url")).toBeNull();
  });
});
