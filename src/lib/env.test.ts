import { afterEach, describe, expect, it } from "vitest";
import { requireEnv } from "./env";

const KEY = "__VACATIONERS_TEST_VAR__";

afterEach(() => {
  delete process.env[KEY];
});

describe("requireEnv", () => {
  it("returns the value when the variable is set", () => {
    process.env[KEY] = "hello";
    expect(requireEnv(KEY)).toBe("hello");
  });

  it("throws when the variable is missing", () => {
    delete process.env[KEY];
    expect(() => requireEnv(KEY)).toThrow(/Missing required environment variable/);
  });

  it("throws when the variable is empty", () => {
    process.env[KEY] = "";
    expect(() => requireEnv(KEY)).toThrow(/Missing required environment variable/);
  });
});
