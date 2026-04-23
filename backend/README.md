## Salon Manager PRO SaaS — Backend

Node.js + Express + PostgreSQL (single DB, multi-tenant via `organization_id` / `tenant_id`).

### Setup

- **Prerequisites**: Node.js 18+ and PostgreSQL 14+
- Create `backend/.env` from `backend/.env.example`
- Ensure `DATABASE_URL` points to your Postgres instance

### Install & run

```bash
cd backend
npm install
npm run dev
```

### Database schema & migrations

This repo uses idempotent SQL migrations in `backend/sql/migrations/`.

- **Initial schema**: `backend/sql/schema.sql`
- **Run one migration**:

```bash
cd backend
npm run migrate:sql -- backend/sql/migrations/022_tenants_multi_tenant_layer.sql
```

### Workers (Bull / Redis)

Notifications are queued to Redis (Bull) when `NOTIFICATIONS_QUEUE_ENABLED=true`.

- Start Redis (local) and then start worker:

```bash
cd backend
node src/workers/notifications.worker.js
```

### Tests

```bash
cd backend
npm test
```

### Multi-tenant model

- **Tenant entity**: `organizations` (legacy name) + `tenants` view
- **Tenant context**: `orgId` / `tenantId` in JWT payload
- **No data leak**: all business queries MUST be scoped by `organization_id` (or `tenant_id`)

