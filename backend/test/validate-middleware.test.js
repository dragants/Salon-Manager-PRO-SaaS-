const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const validate = require("../src/middleware/validate.middleware");

/** Mini Joi-like schema stub for testing the middleware logic. */
function fakeSchema(validator) {
  return {
    validate(data, opts) {
      return validator(data, opts);
    },
  };
}

function mockReqResNext() {
  let statusCode = null;
  let jsonBody = null;
  let nextCalled = false;
  const req = { body: {}, query: {}, params: {} };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      jsonBody = body;
      return this;
    },
  };
  const next = () => {
    nextCalled = true;
  };
  return { req, res, next, getStatus: () => statusCode, getJson: () => jsonBody, wasNextCalled: () => nextCalled };
}

describe("validate middleware", () => {
  it("calls next() when validation passes", () => {
    const schema = fakeSchema((data) => ({ error: null, value: { name: "Test" } }));
    const mw = validate(schema);
    const { req, res, next, wasNextCalled, getStatus } = mockReqResNext();
    req.body = { name: "Test" };

    mw(req, res, next);
    assert.equal(wasNextCalled(), true);
    assert.equal(getStatus(), null);
  });

  it("returns 400 with error message on validation failure", () => {
    const schema = fakeSchema(() => ({
      error: { details: [{ message: "Polje ime je obavezno" }] },
      value: null,
    }));
    const mw = validate(schema);
    const { req, res, next, wasNextCalled, getStatus, getJson } = mockReqResNext();

    mw(req, res, next);
    assert.equal(wasNextCalled(), false);
    assert.equal(getStatus(), 400);
    assert.deepEqual(getJson(), { error: "Polje ime je obavezno" });
  });

  it("validates query source", () => {
    const schema = fakeSchema((data) => ({ error: null, value: { page: 1 } }));
    const mw = validate(schema, "query");
    const { req, res, next, wasNextCalled } = mockReqResNext();
    req.query = { page: "1" };

    mw(req, res, next);
    assert.equal(wasNextCalled(), true);
    assert.deepEqual(req.validatedQuery, { page: 1 });
  });

  it("validates params source", () => {
    const schema = fakeSchema((data) => ({ error: null, value: { id: 42 } }));
    const mw = validate(schema, "params");
    const { req, res, next, wasNextCalled } = mockReqResNext();
    req.params = { id: "42" };

    mw(req, res, next);
    assert.equal(wasNextCalled(), true);
    assert.deepEqual(req.validatedParams, { id: 42 });
  });

  it("assigns validated value back to req.body for body source", () => {
    const schema = fakeSchema((data) => ({
      error: null,
      value: { name: "Trimmed", extra: undefined },
    }));
    const mw = validate(schema);
    const { req, res, next, wasNextCalled } = mockReqResNext();
    req.body = { name: "  Trimmed  ", extra: "junk" };

    mw(req, res, next);
    assert.equal(wasNextCalled(), true);
    // stripUnknown in real Joi removes unknown fields; here we just check value is assigned
    assert.equal(req.body.name, "Trimmed");
  });
});
