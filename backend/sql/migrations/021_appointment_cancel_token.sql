-- 021: Appointment cancellation tokens
-- Klijenti mogu da otkažu termin putem linka u email/SMS podsetniku.
-- Token je random string, jedinstven po terminu.
-- cancelled status se dodaje na appointments.

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('scheduled', 'completed', 'no_show', 'cancelled'));

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancel_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_cancel_token
  ON appointments (cancel_token)
  WHERE cancel_token IS NOT NULL;

-- Komentar: public ruta /public/:slug/cancel/:token
-- ne zahteva autentikaciju — samo validan token.
