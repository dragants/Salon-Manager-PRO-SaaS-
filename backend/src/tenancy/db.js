/**
 * Re-export from utils/db.js to avoid duplication.
 * All tenant-scoped DB logic lives in ../utils/db.js.
 *
 * Existing code that imports from "../tenancy/db" continues to work.
 */
const { db, assertTenantId } = require("../utils/db");

module.exports = { db, assertTenantId };
