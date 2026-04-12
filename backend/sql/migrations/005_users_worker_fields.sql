-- Prikazno ime i profil radnika (usluge / radno vreme po zaposlenom).
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS worker_profile JSONB NOT NULL DEFAULT '{}'::jsonb;
