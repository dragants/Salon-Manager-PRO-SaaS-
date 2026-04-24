const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  ROLE,
  PERM,
  normalizeRole,
  permissionsForRole,
  hasPermission,
} = require("../src/security/permissions");

describe("RBAC: normalizeRole", () => {
  it("normalizes 'worker' to 'staff'", () => {
    assert.equal(normalizeRole("worker"), ROLE.STAFF);
  });

  it("normalizes 'admin' to 'admin'", () => {
    assert.equal(normalizeRole("admin"), ROLE.ADMIN);
  });

  it("normalizes 'owner' to 'owner'", () => {
    assert.equal(normalizeRole("owner"), ROLE.OWNER);
  });

  it("normalizes 'receptionist' to 'receptionist'", () => {
    assert.equal(normalizeRole("receptionist"), ROLE.RECEPTIONIST);
  });

  it("normalizes 'staff' to 'staff'", () => {
    assert.equal(normalizeRole("staff"), ROLE.STAFF);
  });

  it("returns null for unknown role", () => {
    assert.equal(normalizeRole("superadmin"), null);
    assert.equal(normalizeRole(""), null);
    assert.equal(normalizeRole(null), null);
    assert.equal(normalizeRole(undefined), null);
  });
});

describe("RBAC: permissionsForRole", () => {
  it("owner has all permissions", () => {
    const perms = permissionsForRole("owner");
    const allPerms = Object.values(PERM);
    assert.equal(perms.length, allPerms.length);
    for (const p of allPerms) {
      assert.ok(perms.includes(p), `owner should have ${p}`);
    }
  });

  it("admin has most permissions except none missing", () => {
    const perms = permissionsForRole("admin");
    assert.ok(perms.includes(PERM.APPOINTMENTS_READ));
    assert.ok(perms.includes(PERM.APPOINTMENTS_WRITE));
    assert.ok(perms.includes(PERM.APPOINTMENTS_DELETE));
    assert.ok(perms.includes(PERM.CLIENTS_READ));
    assert.ok(perms.includes(PERM.CLIENTS_WRITE));
    assert.ok(perms.includes(PERM.SERVICES_READ));
    assert.ok(perms.includes(PERM.SERVICES_WRITE));
    assert.ok(perms.includes(PERM.TEAM_READ));
    assert.ok(perms.includes(PERM.TEAM_WRITE));
  });

  it("receptionist can read/write appointments and clients", () => {
    const perms = permissionsForRole("receptionist");
    assert.ok(perms.includes(PERM.APPOINTMENTS_READ));
    assert.ok(perms.includes(PERM.APPOINTMENTS_WRITE));
    assert.ok(perms.includes(PERM.CLIENTS_READ));
    assert.ok(perms.includes(PERM.CLIENTS_WRITE));
  });

  it("receptionist cannot delete appointments or manage team", () => {
    const perms = permissionsForRole("receptionist");
    assert.ok(!perms.includes(PERM.APPOINTMENTS_DELETE));
    assert.ok(!perms.includes(PERM.TEAM_WRITE));
    assert.ok(!perms.includes(PERM.TEAM_READ));
  });

  it("staff (worker) can only read appointments, clients, services, settings", () => {
    const perms = permissionsForRole("staff");
    assert.ok(perms.includes(PERM.APPOINTMENTS_READ));
    assert.ok(perms.includes(PERM.CLIENTS_READ));
    assert.ok(perms.includes(PERM.SERVICES_READ));
    assert.ok(perms.includes(PERM.ORG_SETTINGS_READ));
    assert.equal(perms.length, 4);
  });

  it("staff cannot write anything", () => {
    const perms = permissionsForRole("staff");
    assert.ok(!perms.includes(PERM.APPOINTMENTS_WRITE));
    assert.ok(!perms.includes(PERM.CLIENTS_WRITE));
    assert.ok(!perms.includes(PERM.SERVICES_WRITE));
    assert.ok(!perms.includes(PERM.ORG_SETTINGS_WRITE));
  });

  it("legacy 'worker' gets staff permissions", () => {
    const staffPerms = permissionsForRole("staff");
    const workerPerms = permissionsForRole("worker");
    assert.deepEqual(workerPerms, staffPerms);
  });

  it("unknown role gets empty permissions", () => {
    const perms = permissionsForRole("hacker");
    assert.deepEqual(perms, []);
  });
});

describe("RBAC: hasPermission", () => {
  it("owner has appointments:delete", () => {
    assert.equal(hasPermission("owner", PERM.APPOINTMENTS_DELETE), true);
  });

  it("admin has team:write", () => {
    assert.equal(hasPermission("admin", PERM.TEAM_WRITE), true);
  });

  it("receptionist does not have team:write", () => {
    assert.equal(hasPermission("receptionist", PERM.TEAM_WRITE), false);
  });

  it("staff does not have appointments:write", () => {
    assert.equal(hasPermission("staff", PERM.APPOINTMENTS_WRITE), false);
  });

  it("unknown role has no permissions", () => {
    assert.equal(hasPermission("unknown", PERM.APPOINTMENTS_READ), false);
  });
});

describe("RBAC: role hierarchy coverage", () => {
  it("each higher role has at least as many permissions as lower ones", () => {
    const ownerPerms = permissionsForRole("owner");
    const adminPerms = permissionsForRole("admin");
    const receptionistPerms = permissionsForRole("receptionist");
    const staffPerms = permissionsForRole("staff");

    assert.ok(ownerPerms.length >= adminPerms.length, "owner >= admin");
    assert.ok(adminPerms.length >= receptionistPerms.length, "admin >= receptionist");
    assert.ok(receptionistPerms.length >= staffPerms.length, "receptionist >= staff");
  });

  it("admin permissions are a subset of owner permissions", () => {
    const ownerPerms = permissionsForRole("owner");
    const adminPerms = permissionsForRole("admin");
    for (const p of adminPerms) {
      assert.ok(ownerPerms.includes(p), `owner should include admin perm: ${p}`);
    }
  });

  it("staff permissions are a subset of receptionist permissions", () => {
    const receptionistPerms = permissionsForRole("receptionist");
    const staffPerms = permissionsForRole("staff");
    for (const p of staffPerms) {
      assert.ok(receptionistPerms.includes(p), `receptionist should include staff perm: ${p}`);
    }
  });
});
