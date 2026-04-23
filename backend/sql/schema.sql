-- Salon Manager PRO — PostgreSQL schema (multi-tenant)

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  logo TEXT,
  working_hours JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  booking_slug TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended')),
  billing_plan TEXT NOT NULL DEFAULT 'free'
    CHECK (billing_plan IN ('free', 'basic', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_booking_slug_lower
  ON organizations (lower(booking_slug))
  WHERE booking_slug IS NOT NULL AND btrim(booking_slug) <> '';

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin'
    CHECK (role IN ('owner', 'admin', 'receptionist', 'staff', 'worker')),
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED,
  token_version INTEGER NOT NULL DEFAULT 0,
  display_name TEXT,
  worker_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  twofa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  twofa_secret TEXT,
  twofa_backup_codes_hash JSONB NOT NULL DEFAULT '[]'::jsonb,
  mfa_enforced BOOLEAN NOT NULL DEFAULT FALSE,
  password_reset_token_hash TEXT,
  password_reset_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON audit_log(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_chart_entries (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  visit_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT,
  notes TEXT,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_chart_files (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chart_entry_id INTEGER NOT NULL REFERENCES client_chart_entries(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  data BYTEA,
  storage_path TEXT,
  file_size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chart_entries_client ON client_chart_entries(organization_id, client_id);
CREATE INDEX IF NOT EXISTS idx_chart_files_entry ON client_chart_files(chart_entry_id);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED,
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 60,
  buffer_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  staff_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'no_show')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED,
  amount NUMERIC(12, 2) NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_org ON services(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org_date ON appointments(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date ON appointments(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_org_staff ON appointments(organization_id, staff_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);

CREATE TABLE IF NOT EXISTS appointment_notification_log (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (
    kind IN (
      'reminder_day_before',
      'reminder_24h',
      'reminder_2h',
      'no_show',
      'booking_confirm_sms',
      'booking_confirm_wa'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (appointment_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_appt_notif_appt ON appointment_notification_log(appointment_id);

-- Tenants view (SaaS API surface)
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

CREATE TABLE IF NOT EXISTS work_shifts (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT work_shifts_end_after_start CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_work_shifts_org_date
  ON work_shifts (organization_id, shift_date);

CREATE INDEX IF NOT EXISTS idx_work_shifts_org_user_date
  ON work_shifts (organization_id, user_id, shift_date);

CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount_rsd INTEGER NOT NULL CHECK (amount_rsd >= 0),
  title TEXT NOT NULL,
  category TEXT,
  notes TEXT,
  spent_at DATE NOT NULL,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_org_spent
  ON expenses (organization_id, spent_at DESC);

CREATE TABLE IF NOT EXISTS supply_items (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kom',
  quantity NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reorder_min NUMERIC(14, 3),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supply_items_org
  ON supply_items (organization_id);

CREATE INDEX IF NOT EXISTS idx_supply_items_org_name
  ON supply_items (organization_id, lower(name));

CREATE TABLE IF NOT EXISTS supply_movements (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supply_item_id BIGINT NOT NULL REFERENCES supply_items(id) ON DELETE CASCADE,
  delta_qty NUMERIC(14, 3) NOT NULL,
  movement_type TEXT NOT NULL
    CHECK (movement_type IN ('purchase', 'usage', 'adjustment')),
  note TEXT,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supply_movements_org_created
  ON supply_movements (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_supply_movements_item
  ON supply_movements (supply_item_id, created_at DESC);

CREATE TABLE IF NOT EXISTS loyalty_programs (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  visits_required INTEGER NOT NULL CHECK (visits_required >= 2 AND visits_required <= 365),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_programs_org
  ON loyalty_programs (organization_id);

CREATE TABLE IF NOT EXISTS client_loyalty_balances (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  program_id INTEGER NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  stamps INTEGER NOT NULL DEFAULT 0 CHECK (stamps >= 0),
  rewards_available INTEGER NOT NULL DEFAULT 0 CHECK (rewards_available >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, client_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_client_loyalty_client
  ON client_loyalty_balances (organization_id, client_id);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS redeems_loyalty BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS loyalty_program_id INTEGER REFERENCES loyalty_programs(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Migracije 018–021 (idempotentno): kategorije usluga, zalihe po usluzi,
-- ponavljanje termina, otkazivanje putem tokena. Pokreni ceo schema.sql ili
-- pojedinačno fajlove iz backend/sql/migrations/ ako baza već postoji.
-- ---------------------------------------------------------------------------

-- 018: Service categories + kolone na services
CREATE TABLE IF NOT EXISTS service_categories (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_categories_org
  ON service_categories (organization_id, sort_order);

ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id INTEGER
  REFERENCES service_categories(id) ON DELETE SET NULL;

ALTER TABLE services ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_services_org_category
  ON services (organization_id, category_id);

-- 019: Service–supply usage
CREATE TABLE IF NOT EXISTS service_supply_usage (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  supply_item_id BIGINT NOT NULL REFERENCES supply_items(id) ON DELETE CASCADE,
  qty_per_use NUMERIC(14, 3) NOT NULL DEFAULT 1 CHECK (qty_per_use > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, service_id, supply_item_id)
);

CREATE INDEX IF NOT EXISTS idx_service_supply_usage_service
  ON service_supply_usage (organization_id, service_id);

CREATE INDEX IF NOT EXISTS idx_service_supply_usage_item
  ON service_supply_usage (supply_item_id);

-- 020: Recurring appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurrence_group_id UUID;

CREATE INDEX IF NOT EXISTS idx_appointments_recurrence_group
  ON appointments (organization_id, recurrence_group_id)
  WHERE recurrence_group_id IS NOT NULL;

-- 021: Cancel token + status cancelled
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('scheduled', 'completed', 'no_show', 'cancelled'));

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancel_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_cancel_token
  ON appointments (cancel_token)
  WHERE cancel_token IS NOT NULL;
