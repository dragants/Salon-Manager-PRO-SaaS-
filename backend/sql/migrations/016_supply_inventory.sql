-- Potrošni materijal / unutrašnje zalihe (nije maloprodaja klijentima).
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
