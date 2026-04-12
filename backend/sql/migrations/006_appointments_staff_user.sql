-- Dodela termina članu tima (users.id u istoj organizaciji).
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS staff_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_org_staff
  ON appointments(organization_id, staff_user_id);
