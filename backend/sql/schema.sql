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
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'worker')),
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token_version INTEGER NOT NULL DEFAULT 0,
  display_name TEXT,
  worker_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  password_reset_token_hash TEXT,
  password_reset_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 60,
  buffer_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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
  amount NUMERIC(12, 2) NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_org ON services(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org_date ON appointments(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_org_staff ON appointments(organization_id, staff_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);

CREATE TABLE IF NOT EXISTS appointment_notification_log (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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
