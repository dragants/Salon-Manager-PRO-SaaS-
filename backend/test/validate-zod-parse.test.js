const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { z } = require("zod");
const validate = require("../src/middleware/validate");

describe("middleware/validate.js (Zod)", () => {
  it("passes and assigns parsed body", () => {
    const schema = z.object({ a: z.coerce.number() });
    const mw = validate(schema, "body");
    const req = { body: { a: "1" } };
    const res = {
      status() {
        return this;
      },
      json() {
        assert.fail("should not return validation error");
      },
    };
    let nextCalled = false;
    mw(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(req.body.a, 1);
  });

  it("returns 400 with details on ZodError", () => {
    const schema = z.object({ a: z.string().min(2) });
    const mw = validate(schema, "body");
    const req = { body: { a: "x" } };
    let payload;
    const res = {
      status(code) {
        assert.equal(code, 400);
        return this;
      },
      json(body) {
        payload = body;
        return this;
      },
    };
    let nextCalled = false;
    mw(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(payload.error, "Validation failed");
    assert.ok(Array.isArray(payload.details));
    assert.ok(payload.details.length >= 1);
    assert.ok("field" in payload.details[0]);
    assert.ok("message" in payload.details[0]);
  });
});
