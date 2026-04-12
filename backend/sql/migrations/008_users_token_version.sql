-- Sesije: invalidacija JWT nakon promene lozinke / revoke.
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
