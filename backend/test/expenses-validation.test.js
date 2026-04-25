const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  createExpenseSchema,
  updateExpenseSchema,
  listQuerySchema,
  monthlyTotalsQuerySchema,
  idParamSchema,
} = require("../src/modules/expenses/expenses.validation");

describe("expenses validation: createExpenseSchema", () => {
  it("accepts valid expense", () => {
    const { error, value } = createExpenseSchema.validate({
      title: "Zakup prostora",
      amount_rsd: 50000,
      spent_at: "2025-06-15",
    });
    assert.equal(error, undefined);
    assert.equal(value.title, "Zakup prostora");
    assert.equal(value.amount_rsd, 50000);
  });

  it("accepts with category and notes", () => {
    const { error } = createExpenseSchema.validate({
      title: "Marketing",
      amount_rsd: 10000,
      category: "reklama",
      notes: "Google Ads kampanja",
      spent_at: "2025-06-01",
    });
    assert.equal(error, undefined);
  });

  it("rejects missing title", () => {
    const { error } = createExpenseSchema.validate({
      amount_rsd: 1000,
      spent_at: "2025-06-15",
    });
    assert.ok(error);
  });

  it("rejects negative amount", () => {
    const { error } = createExpenseSchema.validate({
      title: "Test",
      amount_rsd: -100,
      spent_at: "2025-06-15",
    });
    assert.ok(error);
  });

  it("rejects amount over 2 billion", () => {
    const { error } = createExpenseSchema.validate({
      title: "Test",
      amount_rsd: 2_000_000_001,
      spent_at: "2025-06-15",
    });
    assert.ok(error);
  });

  it("rejects invalid date format", () => {
    const { error } = createExpenseSchema.validate({
      title: "Test",
      amount_rsd: 100,
      spent_at: "15/06/2025",
    });
    assert.ok(error);
  });

  it("accepts null category", () => {
    const { error } = createExpenseSchema.validate({
      title: "Test",
      amount_rsd: 100,
      spent_at: "2025-06-15",
      category: null,
    });
    assert.equal(error, undefined);
  });
});

describe("expenses validation: listQuerySchema", () => {
  it("accepts valid date range", () => {
    const { error } = listQuerySchema.validate({
      from: "2025-06-01",
      to: "2025-06-30",
    });
    assert.equal(error, undefined);
  });

  it("rejects missing from", () => {
    const { error } = listQuerySchema.validate({ to: "2025-06-30" });
    assert.ok(error);
  });

  it("rejects invalid date format", () => {
    const { error } = listQuerySchema.validate({
      from: "June 1",
      to: "2025-06-30",
    });
    assert.ok(error);
  });
});

describe("expenses validation: monthlyTotalsQuerySchema", () => {
  it("defaults months to 6", () => {
    const { error, value } = monthlyTotalsQuerySchema.validate({});
    assert.equal(error, undefined);
    assert.equal(value.months, 6);
  });

  it("accepts custom months", () => {
    const { error, value } = monthlyTotalsQuerySchema.validate({ months: 12 });
    assert.equal(error, undefined);
    assert.equal(value.months, 12);
  });

  it("rejects months over 24", () => {
    const { error } = monthlyTotalsQuerySchema.validate({ months: 25 });
    assert.ok(error);
  });

  it("rejects zero", () => {
    const { error } = monthlyTotalsQuerySchema.validate({ months: 0 });
    assert.ok(error);
  });
});
