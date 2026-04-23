const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { z } = require("zod");
const validateZod = require("../src/middleware/validate-zod.middleware");

function mockReqResNext() {
  let statusCode = null;
  let jsonBody = null;
  let nextCalled = false;
  const req = { body: {}, query: {}, params: {} };
  const res = {
    status(code) { statusCode = code; return this; },
    json(body) { jsonBody = body; return this; },
  };
  const next = () => { nextCalled = true; };
  return {
    req, res, next,
    getStatus: () => statusCode,
    getJson: () => jsonBody,
    wasNextCalled: () => nextCalled,
  };
}

describe("validateZod middleware", () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  });

  it("calls next() on valid body", () => {
    const mw = validateZod(schema);
    const { req, res, next, wasNextCalled } = mockReqResNext();
    req.body = { name: "Ana", age: 30 };
    mw(req, res, next);
    assert.equal(wasNextCalled(), true);
    assert.equal(req.body.name, "Ana");
    assert.equal(req.body.age, 30);
  });

  it("returns 400 on invalid body", () => {
    const mw = validateZod(schema);
    const { req, res, next, wasNextCalled, getStatus, getJson } = mockReqResNext();
    req.body = { name: "", age: -5 };
    mw(req, res, next);
    assert.equal(wasNextCalled(), false);
    assert.equal(getStatus(), 400);
    const json = getJson();
    assert.ok(json.error);
    assert.ok(Array.isArray(json.issues));
    assert.ok(json.issues.length >= 1);
  });

  it("validates query source", () => {
    const qSchema = z.object({ page: z.coerce.number().int().positive() });
    const mw = validateZod(qSchema, "query");
    const { req, res, next, wasNextCalled } = mockReqResNext();
    req.query = { page: "3" };
    mw(req, res, next);
    assert.equal(wasNextCalled(), true);
    assert.equal(req.validatedQuery.page, 3);
  });

  it("validates params source", () => {
    const pSchema = z.object({ id: z.coerce.number().int().positive() });
    const mw = validateZod(pSchema, "params");
    const { req, res, next, wasNextCalled } = mockReqResNext();
    req.params = { id: "42" };
    mw(req, res, next);
    assert.equal(wasNextCalled(), true);
    assert.equal(req.validatedParams.id, 42);
  });

  it("returns structured issues array on error", () => {
    const mw = validateZod(schema);
    const { req, res, next, getJson } = mockReqResNext();
    req.body = {};
    mw(req, res, next);
    const json = getJson();
    assert.ok(json.issues.length >= 2); // name and age both required
    assert.ok(json.issues[0].path);
    assert.ok(json.issues[0].message);
    assert.ok(json.issues[0].code);
  });
});

describe("public rate limiter key generation", () => {
  it("combines IP and slug", () => {
    // Replicate the key logic from public-rate-limit.middleware.js
    function publicKey(req) {
      const slug = (req.params && req.params.slug) || "unknown";
      return `${req.ip}|${slug}`;
    }

    const req = { ip: "192.168.1.10", params: { slug: "moj-salon" } };
    assert.equal(publicKey(req), "192.168.1.10|moj-salon");
  });

  it("uses 'unknown' when slug is missing", () => {
    function publicKey(req) {
      const slug = (req.params && req.params.slug) || "unknown";
      return `${req.ip}|${slug}`;
    }

    const req = { ip: "10.0.0.1", params: {} };
    assert.equal(publicKey(req), "10.0.0.1|unknown");
  });

  it("different slugs produce different keys for same IP", () => {
    function publicKey(req) {
      const slug = (req.params && req.params.slug) || "unknown";
      return `${req.ip}|${slug}`;
    }

    const key1 = publicKey({ ip: "1.2.3.4", params: { slug: "salon-a" } });
    const key2 = publicKey({ ip: "1.2.3.4", params: { slug: "salon-b" } });
    assert.notEqual(key1, key2);
  });
});
