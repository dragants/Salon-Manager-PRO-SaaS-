-- Loyalty: N završenih termina za istu uslugu → nagrada (besplatna poseta te usluge).
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

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS redeems_loyalty BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS loyalty_program_id INTEGER REFERENCES loyalty_programs(id) ON DELETE SET NULL;
