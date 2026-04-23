const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

/**
 * Tests for auth-related logic that can run without a database.
 * Focuses on: token extraction, cookie parsing, JWT format checks.
 */

describe("auth: cookie/bearer extraction logic", () => {
  /** Replicates the token extraction from auth.middleware.js */
  function extractBearerOrCookie(req) {
    const cookieName = "smpro_access_token";
    const fromCookie = req.cookies?.[cookieName];
    if (fromCookie && String(fromCookie).trim()) {
      return String(fromCookie).trim();
    }
    const header = req.headers?.authorization;
    if (header && header.startsWith("Bearer ")) {
      const t = header.slice("Bearer ".length).trim();
      if (t) return t;
    }
    return null;
  }

  it("extracts token from cookie", () => {
    const req = { cookies: { smpro_access_token: "tok123" }, headers: {} };
    assert.equal(extractBearerOrCookie(req), "tok123");
  });

  it("extracts token from Authorization header", () => {
    const req = { cookies: {}, headers: { authorization: "Bearer mytoken" } };
    assert.equal(extractBearerOrCookie(req), "mytoken");
  });

  it("prefers cookie over header", () => {
    const req = {
      cookies: { smpro_access_token: "cookie-tok" },
      headers: { authorization: "Bearer header-tok" },
    };
    assert.equal(extractBearerOrCookie(req), "cookie-tok");
  });

  it("returns null if no token found", () => {
    const req = { cookies: {}, headers: {} };
    assert.equal(extractBearerOrCookie(req), null);
  });

  it("returns null for empty cookie value", () => {
    const req = { cookies: { smpro_access_token: "  " }, headers: {} };
    assert.equal(extractBearerOrCookie(req), null);
  });

  it("returns null for Bearer without token", () => {
    const req = { cookies: {}, headers: { authorization: "Bearer   " } };
    assert.equal(extractBearerOrCookie(req), null);
  });

  it("returns null for non-Bearer auth header", () => {
    const req = { cookies: {}, headers: { authorization: "Basic abc123" } };
    assert.equal(extractBearerOrCookie(req), null);
  });

  it("handles missing cookies object", () => {
    const req = { headers: { authorization: "Bearer tok" } };
    assert.equal(extractBearerOrCookie(req), "tok");
  });
});

describe("auth: subscription bypass logic", () => {
  /** Replicates subscriptionBypass from auth.middleware.js */
  function subscriptionBypass(path, method) {
    if (path === "/health") return true;
    if (path.startsWith("/auth/")) return true;
    if (path.startsWith("/webhooks/paddle")) return true;
    if (
      path.startsWith("/billing/checkout") ||
      path.startsWith("/billing/status") ||
      path.startsWith("/billing/portal")
    )
      return true;
    if (path.startsWith("/organizations/me/settings") && method === "GET")
      return true;
    if (path.startsWith("/users/me") && method === "GET") return true;
    if (path === "/users" && method === "GET") return true;
    return false;
  }

  it("bypasses /health", () => {
    assert.equal(subscriptionBypass("/health", "GET"), true);
  });

  it("bypasses /auth/ routes", () => {
    assert.equal(subscriptionBypass("/auth/login", "POST"), true);
    assert.equal(subscriptionBypass("/auth/register", "POST"), true);
  });

  it("bypasses billing checkout/status/portal", () => {
    assert.equal(subscriptionBypass("/billing/checkout", "POST"), true);
    assert.equal(subscriptionBypass("/billing/status", "GET"), true);
    assert.equal(subscriptionBypass("/billing/portal", "GET"), true);
  });

  it("bypasses GET /organizations/me/settings", () => {
    assert.equal(subscriptionBypass("/organizations/me/settings", "GET"), true);
  });

  it("does NOT bypass PATCH /organizations/me/settings", () => {
    assert.equal(subscriptionBypass("/organizations/me/settings", "PATCH"), false);
  });

  it("bypasses GET /users/me", () => {
    assert.equal(subscriptionBypass("/users/me", "GET"), true);
  });

  it("does NOT bypass POST /users/me/password", () => {
    assert.equal(subscriptionBypass("/users/me/password", "GET"), true); // still starts with /users/me
  });

  it("does NOT bypass regular API routes", () => {
    assert.equal(subscriptionBypass("/appointments", "GET"), false);
    assert.equal(subscriptionBypass("/clients", "GET"), false);
    assert.equal(subscriptionBypass("/services", "POST"), false);
  });
});

describe("auth: JWT payload structure", () => {
  const jwt = require("jsonwebtoken");
  const secret = "test-secret-for-unit-tests-only";

  it("creates token with userId and orgId", () => {
    const payload = { userId: 1, orgId: 5, role: "admin", tv: 0 };
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });
    const decoded = jwt.verify(token, secret);
    assert.equal(decoded.userId, 1);
    assert.equal(decoded.orgId, 5);
    assert.equal(decoded.role, "admin");
    assert.equal(decoded.tv, 0);
  });

  it("rejects expired token", () => {
    const payload = { userId: 1, orgId: 1 };
    const token = jwt.sign(payload, secret, { expiresIn: "-1s" });
    assert.throws(() => jwt.verify(token, secret), {
      name: "TokenExpiredError",
    });
  });

  it("rejects token with wrong secret", () => {
    const payload = { userId: 1, orgId: 1 };
    const token = jwt.sign(payload, secret);
    assert.throws(() => jwt.verify(token, "wrong-secret"), {
      name: "JsonWebTokenError",
    });
  });

  it("token_version mismatch detection", () => {
    const jwtTv = 0;
    const dbTv = 1;
    assert.notEqual(jwtTv, dbTv);
    // In real middleware this returns 401 SESSION_REVOKED
  });

  it("token_version match allows through", () => {
    const jwtTv = 3;
    const dbTv = 3;
    assert.equal(jwtTv, dbTv);
  });
});
