-- Dodaje buffer između termina po usluzi (čistoće / pripreme).
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER NOT NULL DEFAULT 0;
