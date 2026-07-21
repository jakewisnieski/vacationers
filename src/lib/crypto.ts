import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { requireEnv } from "@/lib/env";

// AES-256-GCM scaffolding for the encrypted Google Calendar refresh token (#6).
// Not wired to anything yet — present now so the calendar opt-in slice has a
// vetted encrypt/decrypt seam and the key requirement is documented.
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // GCM standard nonce length
const KEY_BYTES = 32; // AES-256

function key(): Buffer {
  const decoded = Buffer.from(requireEnv("CALENDAR_TOKEN_ENC_KEY"), "base64");
  if (decoded.length !== KEY_BYTES) {
    throw new Error(
      `CALENDAR_TOKEN_ENC_KEY must decode to ${KEY_BYTES} bytes (got ${decoded.length}); generate one with \`openssl rand -base64 32\`.`,
    );
  }
  return decoded;
}

/** Encrypt UTF-8 plaintext, returning "iv.tag.ciphertext" (each base64). */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((b) => b.toString("base64")).join(".");
}

/** Reverse of encrypt(); throws if the payload is tampered with or truncated. */
export function decrypt(payload: string): string {
  const [ivB64, tagB64, ctB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !ctB64) {
    throw new Error('Malformed ciphertext: expected "iv.tag.ciphertext".');
  }
  const decipher = createDecipheriv(ALGORITHM, key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
