import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { decrypt, encrypt } from "./crypto";

const KEY = "CALENDAR_TOKEN_ENC_KEY";
let previous: string | undefined;

beforeAll(() => {
  previous = process.env[KEY];
  process.env[KEY] = randomBytes(32).toString("base64");
});

afterAll(() => {
  if (previous === undefined) delete process.env[KEY];
  else process.env[KEY] = previous;
});

describe("crypto (AES-256-GCM)", () => {
  it("round-trips plaintext", () => {
    const secret = "1//google-refresh-token-value";
    expect(decrypt(encrypt(secret))).toBe(secret);
  });

  it("uses a fresh IV each call, so ciphertext differs", () => {
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });

  it("rejects tampered ciphertext (auth tag mismatch)", () => {
    const [iv, tag, ct] = encrypt("secret").split(".");
    const bytes = Buffer.from(ct, "base64");
    bytes[0] ^= 0xff;
    const tampered = [iv, tag, bytes.toString("base64")].join(".");
    expect(() => decrypt(tampered)).toThrow();
  });

  it("throws on a malformed payload", () => {
    expect(() => decrypt("not-a-valid-payload")).toThrow(/Malformed/);
  });
});
