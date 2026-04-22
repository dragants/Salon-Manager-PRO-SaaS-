-- 018: Service categories
-- Saloni sa 20+ usluga mogu da ih grupišu (Šišanje, Farbanje, Nega, Masaža…)

CREATE TABLE IF NOT EXISTS service_categories (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_categories_org
  ON service_categories (organization_id, sort_order);

-- Dodaj category_id na services (nullable — postojeće usluge nemaju kategoriju)
ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id INTEGER
  REFERENCES service_categories(id) ON DELETE SET NULL;

-- Dodaj color i opis na services (za booking stranicu i lepši prikaz)
ALTER TABLE services ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT;

-- Index za brzi lookup usluga po kategoriji
CREATE INDEX IF NOT EXISTS idx_services_org_category
  ON services (organization_id, category_id);
