const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  createClientSchema,
  updateClientSchema,
  idParamSchema,
} = require("../src/modules/clients/clients.validation");

describe("clients validation: idParamSchema", () => {
  it("accepts valid positive integer id", () => {
    const { error, value } = idParamSchema.validate({ id: 42 });
    assert.equal(error, undefined);
    assert.equal(value.id, 42);
  });

  it("coerces string id to number", () => {
    const { error, value } = idParamSchema.validate({ id: "7" });
    assert.equal(error, undefined);
    assert.equal(value.id, 7);
  });

  it("rejects zero", () => {
    const { error } = idParamSchema.validate({ id: 0 });
    assert.ok(error);
  });

  it("rejects negative", () => {
    const { error } = idParamSchema.validate({ id: -1 });
    assert.ok(error);
  });

  it("rejects non-integer", () => {
    const { error } = idParamSchema.validate({ id: 3.5 });
    assert.ok(error);
  });

  it("rejects non-numeric string (SQL injection attempt)", () => {
    const { error } = idParamSchema.validate({ id: "1; DROP TABLE clients;" });
    assert.ok(error);
  });

  it("rejects missing id", () => {
    const { error } = idParamSchema.validate({});
    assert.ok(error);
  });
});

describe("clients validation: createClientSchema", () => {
  it("accepts valid client", () => {
    const { error, value } = createClientSchema.validate({
      name: "Marija Petrović",
      phone: "+381641234567",
    });
    assert.equal(error, undefined);
    assert.equal(value.name, "Marija Petrović");
  });

  it("accepts client with email", () => {
    const { error, value } = createClientSchema.validate({
      name: "Ana",
      phone: "0641234567",
      email: "ana@test.rs",
    });
    assert.equal(error, undefined);
    assert.equal(value.email, "ana@test.rs");
  });

  it("rejects missing name", () => {
    const { error } = createClientSchema.validate({ phone: "064" });
    assert.ok(error);
  });

  it("rejects short name", () => {
    const { error } = createClientSchema.validate({ name: "A", phone: "064" });
    assert.ok(error);
  });

  it("requires phone", () => {
    const { error } = createClientSchema.validate({ name: "Test Klijent" });
    assert.ok(error, "phone should be required");
  });

  it("rejects invalid email format", () => {
    const { error } = createClientSchema.validate({
      name: "Test",
      email: "not-email",
    });
    assert.ok(error);
  });
});

describe("clients validation: updateClientSchema", () => {
  it("accepts partial update with name only", () => {
    const { error, value } = updateClientSchema.validate({ name: "Novo ime" });
    assert.equal(error, undefined);
    assert.equal(value.name, "Novo ime");
  });

  it("accepts phone update", () => {
    const { error } = updateClientSchema.validate({ phone: "+381641111111" });
    assert.equal(error, undefined);
  });

  it("rejects empty object", () => {
    const { error } = updateClientSchema.validate({});
    assert.ok(error);
  });
});
