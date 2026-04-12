-- Email klijenta (npr. potvrda online rezervacije)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;
