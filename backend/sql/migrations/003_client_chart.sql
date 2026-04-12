-- Karton klijenta: beleške posle tretmana + prilozi (binarno u bazi)

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
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chart_entries_client ON client_chart_entries(organization_id, client_id);
CREATE INDEX IF NOT EXISTS idx_chart_files_entry ON client_chart_files(chart_entry_id);
