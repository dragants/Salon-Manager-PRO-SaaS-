const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test_secret_test_secret_test_secret_32chars";

const hasDb = Boolean(process.env.DATABASE_URL);
const { generate } = require("../src/utils/jwt");

async function httpJson({ server, method, path, token }) {
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

test("multi-tenant: /clients does not leak across tenants", { skip: !hasDb }, async () => {
  const pool = require("../src/config/db");
  const app = require("../src/app");
  const notificationsQueue = require("../../queue/notifications");
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });

  let orgA;
  let orgB;
  let userA;
  let userB;
  let clientA;
  let clientB;

  try {
    const orgResA = await pool.query(
      `INSERT INTO organizations(name) VALUES('Tenant A') RETURNING id`
    );
    const orgResB = await pool.query(
      `INSERT INTO organizations(name) VALUES('Tenant B') RETURNING id`
    );
    orgA = orgResA.rows[0].id;
    orgB = orgResB.rows[0].id;

    const uA = await pool.query(
      `INSERT INTO users(email, password, organization_id, role)
       VALUES('a_leak_test@example.com', 'x', $1, 'admin') RETURNING id`,
      [orgA]
    );
    const uB = await pool.query(
      `INSERT INTO users(email, password, organization_id, role)
       VALUES('b_leak_test@example.com', 'x', $1, 'admin') RETURNING id`,
      [orgB]
    );
    userA = uA.rows[0].id;
    userB = uB.rows[0].id;

    const cA = await pool.query(
      `INSERT INTO clients(organization_id, name, phone)
       VALUES($1, 'Client A', '111') RETURNING id`,
      [orgA]
    );
    const cB = await pool.query(
      `INSERT INTO clients(organization_id, name, phone)
       VALUES($1, 'Client B', '222') RETURNING id`,
      [orgB]
    );
    clientA = cA.rows[0].id;
    clientB = cB.rows[0].id;

    const tokenA = generate({ userId: userA, orgId: orgA, tenantId: orgA, role: "admin", tv: 0, mfa: true });
    const tokenB = generate({ userId: userB, orgId: orgB, tenantId: orgB, role: "admin", tv: 0, mfa: true });

    const rA = await httpJson({
      server,
      method: "GET",
      path: "/clients",
      token: tokenA,
    });
    assert.equal(rA.status, 200);
    assert.ok(Array.isArray(rA.json));
    assert.ok(rA.json.some((c) => c.id === clientA));
    assert.ok(!rA.json.some((c) => c.id === clientB));

    const rB = await httpJson({
      server,
      method: "GET",
      path: "/clients",
      token: tokenB,
    });
    assert.equal(rB.status, 200);
    assert.ok(Array.isArray(rB.json));
    assert.ok(rB.json.some((c) => c.id === clientB));
    assert.ok(!rB.json.some((c) => c.id === clientA));
  } finally {
    server.close();
    try {
      await notificationsQueue.close();
    } catch {
      /* ignore */
    }
    // cleanup best-effort
    if (clientA) await pool.query(`DELETE FROM clients WHERE id = $1`, [clientA]);
    if (clientB) await pool.query(`DELETE FROM clients WHERE id = $1`, [clientB]);
    if (userA) await pool.query(`DELETE FROM users WHERE id = $1`, [userA]);
    if (userB) await pool.query(`DELETE FROM users WHERE id = $1`, [userB]);
    if (orgA) await pool.query(`DELETE FROM organizations WHERE id = $1`, [orgA]);
    if (orgB) await pool.query(`DELETE FROM organizations WHERE id = $1`, [orgB]);
  }
});

