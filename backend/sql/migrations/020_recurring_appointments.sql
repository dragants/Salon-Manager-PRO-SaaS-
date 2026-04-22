-- 020: Recurring appointments
-- Podrška za ponavljajuće termine ("svake 4 nedelje").
-- recurrence_rule čuva interval u nedeljama.
-- recurrence_group_id grupiše sve termine nastale iz istog ponavljanja.

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;
-- Format: {"every_weeks": 4, "count": 6} — svake 4 nedelje, max 6 termina
-- Ili: {"every_weeks": 2} — svake 2 nedelje, bez limita (ručno zaustavljanje)

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS recurrence_group_id UUID;

CREATE INDEX IF NOT EXISTS idx_appointments_recurrence_group
  ON appointments (organization_id, recurrence_group_id)
  WHERE recurrence_group_id IS NOT NULL;

-- Komentar: frontend/backend koriste recurrence_group_id da prikažu
-- seriju termina zajedno i omoguće batch operacije (otkaži sve buduće itd.)
