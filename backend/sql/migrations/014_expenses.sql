-- Operativni troškovi salona (po organizaciji).
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

CREATE INDEX IF NOT EXISTS idx_expenses_org_id
  ON expenses (organization_id, id);
