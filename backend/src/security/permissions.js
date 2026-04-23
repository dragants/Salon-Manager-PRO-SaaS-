const ROLE = Object.freeze({
  OWNER: "owner",
  ADMIN: "admin",
  RECEPTIONIST: "receptionist",
  STAFF: "staff",
});

/**
 * Permissions are expressed as `resource:action`.
 * Keep this small and composable; add as needed.
 */
const PERM = Object.freeze({
  APPOINTMENTS_READ: "appointments:read",
  APPOINTMENTS_WRITE: "appointments:write",
  APPOINTMENTS_DELETE: "appointments:delete",

  CLIENTS_READ: "clients:read",
  CLIENTS_WRITE: "clients:write",
  CLIENTS_DELETE: "clients:delete",

  SERVICES_READ: "services:read",
  SERVICES_WRITE: "services:write",

  PAYMENTS_READ: "payments:read",
  PAYMENTS_WRITE: "payments:write",

  ORG_SETTINGS_READ: "org_settings:read",
  ORG_SETTINGS_WRITE: "org_settings:write",

  AUDIT_READ: "audit:read",

  TEAM_READ: "team:read",
  TEAM_WRITE: "team:write",
});

const ROLE_PERMISSIONS = Object.freeze({
  [ROLE.OWNER]: Object.values(PERM),
  [ROLE.ADMIN]: [
    PERM.APPOINTMENTS_READ,
    PERM.APPOINTMENTS_WRITE,
    PERM.APPOINTMENTS_DELETE,
    PERM.CLIENTS_READ,
    PERM.CLIENTS_WRITE,
    PERM.CLIENTS_DELETE,
    PERM.SERVICES_READ,
    PERM.SERVICES_WRITE,
    PERM.PAYMENTS_READ,
    PERM.PAYMENTS_WRITE,
    PERM.ORG_SETTINGS_READ,
    PERM.ORG_SETTINGS_WRITE,
    PERM.AUDIT_READ,
    PERM.TEAM_READ,
    PERM.TEAM_WRITE,
  ],
  [ROLE.RECEPTIONIST]: [
    PERM.APPOINTMENTS_READ,
    PERM.APPOINTMENTS_WRITE,
    PERM.CLIENTS_READ,
    PERM.CLIENTS_WRITE,
    PERM.SERVICES_READ,
    PERM.PAYMENTS_READ,
    PERM.PAYMENTS_WRITE,
    PERM.ORG_SETTINGS_READ,
  ],
  [ROLE.STAFF]: [
    PERM.APPOINTMENTS_READ,
    PERM.CLIENTS_READ,
    PERM.SERVICES_READ,
    PERM.ORG_SETTINGS_READ,
  ],
});

function normalizeRole(role) {
  if (role === "worker") {
    return ROLE.STAFF;
  }
  if (role === "admin") {
    return ROLE.ADMIN;
  }
  if (role === "owner") {
    return ROLE.OWNER;
  }
  if (role === "receptionist") {
    return ROLE.RECEPTIONIST;
  }
  if (role === "staff") {
    return ROLE.STAFF;
  }
  return null;
}

function permissionsForRole(role) {
  const r = normalizeRole(role);
  if (!r) {
    return [];
  }
  return ROLE_PERMISSIONS[r] || [];
}

function hasPermission(role, permission) {
  return permissionsForRole(role).includes(permission);
}

module.exports = { ROLE, PERM, normalizeRole, permissionsForRole, hasPermission };

