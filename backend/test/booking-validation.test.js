const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  publicSlugParamsSchema,
  publicCancelParamsSchema,
  slotsQuerySchema,
  bookBodySchema,
} = require("../src/modules/booking/booking.validation");

describe("booking validation: publicSlugParamsSchema", () => {
  it("accepts valid slug", () => {
    const r = publicSlugParamsSchema.safeParse({ slug: "moj-salon" });
    assert.equal(r.success, true);
    assert.equal(r.data.slug, "moj-salon");
  });

  it("accepts single-word slug", () => {
    const r = publicSlugParamsSchema.safeParse({ slug: "salon123" });
    assert.equal(r.success, true);
  });

  it("rejects empty slug", () => {
    const r = publicSlugParamsSchema.safeParse({ slug: "" });
    assert.equal(r.success, false);
  });

  it("rejects slug with spaces", () => {
    const r = publicSlugParamsSchema.safeParse({ slug: "moj salon" });
    assert.equal(r.success, false);
  });

  it("rejects slug with special characters", () => {
    const r = publicSlugParamsSchema.safeParse({ slug: "moj@salon" });
    assert.equal(r.success, false);
  });

  it("rejects slug over 160 chars", () => {
    const r = publicSlugParamsSchema.safeParse({ slug: "a".repeat(161) });
    assert.equal(r.success, false);
  });
});

describe("booking validation: publicCancelParamsSchema", () => {
  it("accepts valid slug + token", () => {
    const r = publicCancelParamsSchema.safeParse({
      slug: "moj-salon",
      token: "abc123XYZ_-def456",
    });
    assert.equal(r.success, true);
  });

  it("rejects short token (<8 chars)", () => {
    const r = publicCancelParamsSchema.safeParse({
      slug: "moj-salon",
      token: "abc",
    });
    assert.equal(r.success, false);
  });

  it("rejects token with invalid chars", () => {
    const r = publicCancelParamsSchema.safeParse({
      slug: "moj-salon",
      token: "abc 123!@#",
    });
    assert.equal(r.success, false);
  });

  it("rejects token over 256 chars", () => {
    const r = publicCancelParamsSchema.safeParse({
      slug: "moj-salon",
      token: "a".repeat(257),
    });
    assert.equal(r.success, false);
  });
});

describe("booking validation: slotsQuerySchema", () => {
  it("accepts valid slots query", () => {
    const r = slotsQuerySchema.safeParse({
      service_id: "5",
      date: "2025-06-15",
      timezone: "Europe/Belgrade",
    });
    assert.equal(r.success, true);
    assert.equal(r.data.service_id, 5);
    assert.equal(r.data.date, "2025-06-15");
  });

  it("coerces service_id string to number", () => {
    const r = slotsQuerySchema.safeParse({
      service_id: "42",
      date: "2025-01-01",
    });
    assert.equal(r.success, true);
    assert.equal(r.data.service_id, 42);
  });

  it("rejects invalid date format", () => {
    const r = slotsQuerySchema.safeParse({
      service_id: "1",
      date: "15/06/2025",
    });
    assert.equal(r.success, false);
  });

  it("rejects negative service_id", () => {
    const r = slotsQuerySchema.safeParse({
      service_id: "-1",
      date: "2025-01-01",
    });
    assert.equal(r.success, false);
  });

  it("rejects non-integer service_id", () => {
    const r = slotsQuerySchema.safeParse({
      service_id: "3.5",
      date: "2025-01-01",
    });
    assert.equal(r.success, false);
  });

  it("allows missing timezone (optional)", () => {
    const r = slotsQuerySchema.safeParse({
      service_id: "1",
      date: "2025-01-01",
    });
    assert.equal(r.success, true);
    assert.equal(r.data.timezone, undefined);
  });

  it("trims empty timezone to undefined", () => {
    const r = slotsQuerySchema.safeParse({
      service_id: "1",
      date: "2025-01-01",
      timezone: "  ",
    });
    assert.equal(r.success, true);
    assert.equal(r.data.timezone, undefined);
  });
});

describe("booking validation: bookBodySchema", () => {
  const valid = {
    name: "Marija Petrović",
    phone: "+381641234567",
    service_id: "3",
    start: "2025-06-15T10:00:00+02:00",
  };

  it("accepts valid booking body", () => {
    const r = bookBodySchema.safeParse(valid);
    assert.equal(r.success, true);
    assert.equal(r.data.name, "Marija Petrović");
    assert.equal(r.data.service_id, 3);
  });

  it("rejects missing name", () => {
    const r = bookBodySchema.safeParse({ ...valid, name: undefined });
    assert.equal(r.success, false);
  });

  it("rejects empty name", () => {
    const r = bookBodySchema.safeParse({ ...valid, name: "" });
    assert.equal(r.success, false);
  });

  it("rejects name over 200 chars", () => {
    const r = bookBodySchema.safeParse({ ...valid, name: "A".repeat(201) });
    assert.equal(r.success, false);
  });

  it("rejects missing phone", () => {
    const r = bookBodySchema.safeParse({ ...valid, phone: undefined });
    assert.equal(r.success, false);
  });

  it("rejects phone under 3 chars", () => {
    const r = bookBodySchema.safeParse({ ...valid, phone: "06" });
    assert.equal(r.success, false);
  });

  it("accepts empty email as undefined", () => {
    const r = bookBodySchema.safeParse({ ...valid, email: "" });
    assert.equal(r.success, true);
    assert.equal(r.data.email, undefined);
  });

  it("accepts null email as undefined", () => {
    const r = bookBodySchema.safeParse({ ...valid, email: null });
    assert.equal(r.success, true);
    assert.equal(r.data.email, undefined);
  });

  it("accepts valid email", () => {
    const r = bookBodySchema.safeParse({ ...valid, email: "marija@test.rs" });
    assert.equal(r.success, true);
    assert.equal(r.data.email, "marija@test.rs");
  });

  it("rejects invalid email format", () => {
    const r = bookBodySchema.safeParse({ ...valid, email: "not-email" });
    assert.equal(r.success, false);
  });

  it("coerces staff_user_id from string", () => {
    const r = bookBodySchema.safeParse({ ...valid, staff_user_id: "7" });
    assert.equal(r.success, true);
    assert.equal(r.data.staff_user_id, 7);
  });

  it("transforms empty staff_user_id to undefined", () => {
    const r = bookBodySchema.safeParse({ ...valid, staff_user_id: "" });
    assert.equal(r.success, true);
    assert.equal(r.data.staff_user_id, undefined);
  });

  it("transforms null staff_user_id to undefined", () => {
    const r = bookBodySchema.safeParse({ ...valid, staff_user_id: null });
    assert.equal(r.success, true);
    assert.equal(r.data.staff_user_id, undefined);
  });
});
