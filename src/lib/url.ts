// Generic URL helpers shared by the planning boards (ideas #26, activities #27,
// and later link-bearing content): a pragmatic http(s)-only validity check and
// a bare-host extractor for link chips. Pure — no I/O, so freely unit-tested.

/** A pragmatic web-URL check — parseable and http(s)-schemed. */
export function isValidUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  return parsed.protocol === "http:" || parsed.protocol === "https:";
}

/** Bare host for a link chip, e.g. "airbnb.com" — null when unparseable. */
export function hostOf(url: string): string | null {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}
