-- 022: Tenants (SaaS) compatibility layer + tenant_id columns
-- Goal:
-- - Introduce `tenants` model (as a VIEW over existing `organizations`)
-- - Add `tenant_id` to business tables without breaking existing `organization_id` code
--   (use GENERATED ALWAYS AS (organization_id) STORED)
--
-- This keeps the current code working while making the DB explicitly multi-tenant.

-- 1) Add tenant status on organizations (source of truth)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_status_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_status_check
  CHECK (status IN ('active', 'suspended'));

-- 2) Tenants view (required by spec)
DROP VIEW IF EXISTS tenants;
CREATE VIEW tenants AS
SELECT
  o.id,
  o.name,
  COALESCE(NULLIF(btrim(o.settings->>'timezone'), ''), 'Europe/Belgrade') AS timezone,
  COALESCE(NULLIF(btrim(o.settings #>> '{finance,currency}'), ''), 'RSD') AS currency,
  o.status,
  o.billing_plan AS plan
FROM organizations o;

-- 3) tenant_id columns (generated from organization_id for backwards compatibility)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE appointment_notification_log
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

-- Optional tables that exist in this repo (still business data)
ALTER TABLE work_shifts
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE supply_items
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE supply_movements
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE loyalty_programs
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE client_loyalty_balances
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE service_categories
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE service_supply_usage
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE client_chart_entries
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE client_chart_files
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED;

-- 4) Indexes on tenant_id (for future queries + uniqueness per tenant)
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date ON appointments(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);

-- 5) Per-tenant uniqueness examples (non-breaking, partial where needed)
-- Email uniqueness is currently global in schema.sql; keep it for now to avoid breaking existing auth.
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_tenant_phone_lower_unique
  ON clients(tenant_id, lower(phone))
  WHERE phone IS NOT NULL AND btrim(phone) <> '';

