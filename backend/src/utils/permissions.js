// Granular permissions map (SaaS RBAC)

const roles = {
  owner: ["manage_all"],

  admin: [
    "manage_users",
    "manage_employees",
    "manage_clients",
    "manage_services",
    "manage_appointments",
    "manage_payments",
    "view_reports",
  ],

  receptionist: ["manage_clients", "manage_appointments", "view_services"],

  staff: ["view_own_appointments", "update_own_appointments"],
};

function hasPermission(role, permission) {
  if (!role) return false;
  if (roles[role]?.includes("manage_all")) return true;
  return Boolean(roles[role]?.includes(permission));
}

module.exports = { roles, hasPermission };

