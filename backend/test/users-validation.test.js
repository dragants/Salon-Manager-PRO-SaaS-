const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  idParamSchema,
  createTeamMemberSchema,
  patchTeamMemberSchema,
  changePasswordSchema,
} = require("../src/modules/users/users.validation");

describe("users validation: idParamSchema", () => {
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

  it("rejects non-numeric string", () => {
    const { error } = idParamSchema.validate({ id: "abc" });
    assert.ok(error);
  });

  it("rejects missing id", () => {
    const { error } = idParamSchema.validate({});
    assert.ok(error);
  });
});

describe("users validation: createTeamMemberSchema", () => {
  it("accepts valid team member", () => {
    const { error, value } = createTeamMemberSchema.validate({
      email: "new@salon.rs",
      password: "secure123",
      role: "admin",
    });
    assert.equal(error, undefined);
    assert.equal(value.email, "new@salon.rs");
    assert.equal(value.role, "admin");
  });

  it("accepts worker role", () => {
    const { error } = createTeamMemberSchema.validate({
      email: "radnik@salon.rs",
      password: "password123",
      role: "worker",
    });
    assert.equal(error, undefined);
  });

  it("rejects invalid role", () => {
    const { error } = createTeamMemberSchema.validate({
      email: "test@test.rs",
      password: "password123",
      role: "superadmin",
    });
    assert.ok(error);
  });

  it("rejects short password", () => {
    const { error } = createTeamMemberSchema.validate({
      email: "test@test.rs",
      password: "short",
      role: "admin",
    });
    assert.ok(error);
  });

  it("rejects invalid email", () => {
    const { error } = createTeamMemberSchema.validate({
      email: "not-an-email",
      password: "password123",
      role: "admin",
    });
    assert.ok(error);
  });

  it("accepts display_name", () => {
    const { error, value } = createTeamMemberSchema.validate({
      email: "test@salon.rs",
      password: "password123",
      role: "admin",
      display_name: "Marija P.",
    });
    assert.equal(error, undefined);
    assert.equal(value.display_name, "Marija P.");
  });
});

describe("users validation: changePasswordSchema", () => {
  it("accepts valid password change", () => {
    const { error } = changePasswordSchema.validate({
      current_password: "old12345",
      new_password: "new12345",
    });
    assert.equal(error, undefined);
  });

  it("rejects same current and new password", () => {
    const { error } = changePasswordSchema.validate({
      current_password: "same1234",
      new_password: "same1234",
    });
    assert.ok(error);
  });

  it("rejects short new password", () => {
    const { error } = changePasswordSchema.validate({
      current_password: "current1",
      new_password: "short",
    });
    assert.ok(error);
  });

  it("rejects missing current_password", () => {
    const { error } = changePasswordSchema.validate({
      new_password: "newpassword",
    });
    assert.ok(error);
  });
});
