-- 019: Service-Supply usage mapping
-- Definise koliko materijala se troši po jednoj usluzi.
-- Kada se termin završi (status = completed), sistem može automatski
-- da umanji zalihe na osnovu ove tabele.

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
