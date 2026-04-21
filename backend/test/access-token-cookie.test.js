const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

describe("accessTokenCookieOptions", () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Clear cached module so env changes take effect
    delete require.cache[require.resolve("../src/config/accessTokenCookie")];
    delete require.cache[require.resolve("../src/config/env")];
  });

  afterEach(() => {
    process.env = originalEnv;
    delete require.cache[require.resolve("../src/config/accessTokenCookie")];
    delete require.cache[require.resolve("../src/config/env")];
  });

  it("sets httpOnly: true always", () => {
    process.env.NODE_ENV = "development";
    process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-dev";
    const { accessTokenCookieOptions } = require("../src/config/accessTokenCookie");
    const opts = accessTokenCookieOptions(3600000);
    assert.equal(opts.httpOnly, true);
  });

  it("sets secure: false in development", () => {
    process.env.NODE_ENV = "development";
    process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-dev";
    delete process.env.COOKIE_SECURE;
    delete process.env.COOKIE_INSECURE;
    const { accessTokenCookieOptions } = require("../src/config/accessTokenCookie");
    const opts = accessTokenCookieOptions(3600000);
    assert.equal(opts.secure, false);
    assert.equal(opts.sameSite, "lax");
  });

  it("sets secure: true in production", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "a-very-long-production-secret-at-least-32-chars!!";
    delete process.env.COOKIE_SECURE;
    delete process.env.COOKIE_INSECURE;
    const { accessTokenCookieOptions } = require("../src/config/accessTokenCookie");
    const opts = accessTokenCookieOptions(3600000);
    assert.equal(opts.secure, true);
    assert.equal(opts.sameSite, "none");
  });

  it("respects COOKIE_SECURE override", () => {
    process.env.NODE_ENV = "development";
    process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-dev";
    process.env.COOKIE_SECURE = "true";
    const { accessTokenCookieOptions } = require("../src/config/accessTokenCookie");
    const opts = accessTokenCookieOptions(3600000);
    assert.equal(opts.secure, true);
  });

  it("sets correct maxAge", () => {
    process.env.NODE_ENV = "development";
    process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-dev";
    const { accessTokenCookieOptions } = require("../src/config/accessTokenCookie");
    const ms = 7 * 24 * 60 * 60 * 1000;
    const opts = accessTokenCookieOptions(ms);
    assert.equal(opts.maxAge, ms);
    assert.equal(opts.path, "/");
  });

  it("exports correct duration constants", () => {
    process.env.NODE_ENV = "development";
    process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-dev";
    const { REMEMBER_MAX_AGE_MS, SESSION_MAX_AGE_MS } = require("../src/config/accessTokenCookie");
    assert.equal(REMEMBER_MAX_AGE_MS, 7 * 24 * 60 * 60 * 1000);
    assert.equal(SESSION_MAX_AGE_MS, 12 * 60 * 60 * 1000);
  });
});
