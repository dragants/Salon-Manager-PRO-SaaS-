const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { hashPassword, comparePassword } = require("../src/utils/hash");

describe("hashPassword + comparePassword", () => {
  it("hashes a password and verifies correctly", async () => {
    const plain = "TestPassword123!";
    const hashed = await hashPassword(plain);

    // Hash should be a bcrypt string, not the plain password
    assert.notEqual(hashed, plain);
    assert.ok(hashed.startsWith("$2b$") || hashed.startsWith("$2a$"));

    // Correct password should verify
    const match = await comparePassword(plain, hashed);
    assert.equal(match, true);
  });

  it("rejects wrong password", async () => {
    const hashed = await hashPassword("correct");
    const match = await comparePassword("wrong", hashed);
    assert.equal(match, false);
  });

  it("produces different hashes for same password (salt)", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    assert.notEqual(a, b); // different salts
  });

  it("handles empty string", async () => {
    const hashed = await hashPassword("");
    assert.ok(hashed.length > 0);
    assert.equal(await comparePassword("", hashed), true);
    assert.equal(await comparePassword("x", hashed), false);
  });

  it("handles unicode passwords", async () => {
    const plain = "Šifra_Ćirilica_2024!";
    const hashed = await hashPassword(plain);
    assert.equal(await comparePassword(plain, hashed), true);
    assert.equal(await comparePassword("Sifra_Cirilica_2024!", hashed), false);
  });
});
