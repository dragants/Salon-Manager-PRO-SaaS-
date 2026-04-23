const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  createServiceSchema,
  updateServiceSchema,
  createCategorySchema,
  updateCategorySchema,
} = require("../src/modules/services/services.validation");

describe("services validation: createServiceSchema", () => {
  it("accepts valid service", () => {
    const { error, value } = createServiceSchema.validate({
      name: "Šišanje",
      price: 1500,
      duration: 45,
    });
    assert.equal(error, undefined);
    assert.equal(value.name, "Šišanje");
    assert.equal(value.price, 1500);
    assert.equal(value.duration, 45);
  });

  it("defaults duration to 60", () => {
    const { value } = createServiceSchema.validate({ name: "Test", price: 100 });
    assert.equal(value.duration, 60);
  });

  it("defaults buffer_minutes to 0", () => {
    const { value } = createServiceSchema.validate({ name: "Test", price: 100 });
    assert.equal(value.buffer_minutes, 0);
  });

  it("rejects missing name", () => {
    const { error } = createServiceSchema.validate({ price: 100 });
    assert.ok(error);
  });

  it("rejects name under 2 chars", () => {
    const { error } = createServiceSchema.validate({ name: "A", price: 100 });
    assert.ok(error);
  });

  it("rejects negative price", () => {
    const { error } = createServiceSchema.validate({ name: "Test", price: -10 });
    assert.ok(error);
  });

  it("accepts category_id", () => {
    const { error, value } = createServiceSchema.validate({
      name: "Masaža",
      price: 3000,
      category_id: 5,
    });
    assert.equal(error, undefined);
    assert.equal(value.category_id, 5);
  });

  it("accepts null category_id", () => {
    const { error, value } = createServiceSchema.validate({
      name: "Masaža",
      price: 3000,
      category_id: null,
    });
    assert.equal(error, undefined);
    assert.equal(value.category_id, null);
  });

  it("accepts color", () => {
    const { error, value } = createServiceSchema.validate({
      name: "Farbanje",
      price: 4000,
      color: "#ff5733",
    });
    assert.equal(error, undefined);
    assert.equal(value.color, "#ff5733");
  });

  it("accepts description", () => {
    const { error, value } = createServiceSchema.validate({
      name: "Nega lica",
      price: 2500,
      description: "Hidratantna nega sa maskama",
    });
    assert.equal(error, undefined);
    assert.equal(value.description, "Hidratantna nega sa maskama");
  });

  it("rejects description over 500 chars", () => {
    const { error } = createServiceSchema.validate({
      name: "Test",
      price: 100,
      description: "A".repeat(501),
    });
    assert.ok(error);
  });
});

describe("services validation: updateServiceSchema", () => {
  it("accepts partial update with name only", () => {
    const { error, value } = updateServiceSchema.validate({ name: "Novo ime" });
    assert.equal(error, undefined);
    assert.equal(value.name, "Novo ime");
  });

  it("accepts category_id update", () => {
    const { error, value } = updateServiceSchema.validate({ category_id: 3 });
    assert.equal(error, undefined);
    assert.equal(value.category_id, 3);
  });

  it("rejects empty object", () => {
    const { error } = updateServiceSchema.validate({});
    assert.ok(error);
  });
});

describe("services validation: createCategorySchema", () => {
  it("accepts valid category", () => {
    const { error, value } = createCategorySchema.validate({ name: "Šišanje" });
    assert.equal(error, undefined);
    assert.equal(value.name, "Šišanje");
    assert.equal(value.sort_order, 0);
  });

  it("accepts category with sort_order", () => {
    const { error, value } = createCategorySchema.validate({
      name: "Farbanje",
      sort_order: 2,
    });
    assert.equal(error, undefined);
    assert.equal(value.sort_order, 2);
  });

  it("rejects empty name", () => {
    const { error } = createCategorySchema.validate({ name: "" });
    assert.ok(error);
  });

  it("rejects name over 100 chars", () => {
    const { error } = createCategorySchema.validate({ name: "A".repeat(101) });
    assert.ok(error);
  });
});

describe("services validation: updateCategorySchema", () => {
  it("accepts name update", () => {
    const { error, value } = updateCategorySchema.validate({ name: "Novo ime" });
    assert.equal(error, undefined);
  });

  it("accepts sort_order update", () => {
    const { error, value } = updateCategorySchema.validate({ sort_order: 5 });
    assert.equal(error, undefined);
  });

  it("rejects empty object", () => {
    const { error } = updateCategorySchema.validate({});
    assert.ok(error);
  });
});
