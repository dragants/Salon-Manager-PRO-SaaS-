const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { intervalOverlap } = require("../src/utils/intervalOverlap");

describe("intervalOverlap", () => {
  it("returns false when intervals are disjoint", () => {
    assert.equal(intervalOverlap(0, 60, 60, 120), false);
    assert.equal(intervalOverlap(60, 120, 0, 60), false);
  });

  it("returns false when intervals are adjacent (half-open, no overlap)", () => {
    assert.equal(intervalOverlap(0, 60, 60, 120), false);
  });

  it("returns true on partial overlap", () => {
    assert.equal(intervalOverlap(0, 90, 60, 120), true);
    assert.equal(intervalOverlap(30, 90, 0, 60), true);
  });

  it("returns true when one interval contains the other", () => {
    assert.equal(intervalOverlap(0, 120, 30, 60), true);
  });
});
