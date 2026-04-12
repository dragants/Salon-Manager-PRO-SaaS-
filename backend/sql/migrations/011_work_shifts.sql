-- Smene po danu (Shift Planner → dostupnost termina)

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
