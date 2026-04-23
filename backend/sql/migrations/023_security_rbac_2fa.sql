-- 023: Security hardening (RBAC roles + 2FA fields)

-- 1) Expand user roles (keep old values working)
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('owner', 'admin', 'receptionist', 'staff', 'worker'));

-- Normalize legacy 'worker' -> 'staff' (optional)
UPDATE users SET role = 'staff' WHERE role = 'worker';

-- 2) 2FA fields (TOTP)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS twofa_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS twofa_secret TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS twofa_backup_codes_hash JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mfa_enforced BOOLEAN NOT NULL DEFAULT FALSE;

-- For existing admins: enforce MFA requirement flag (they still need to complete setup in app)
UPDATE users
SET mfa_enforced = TRUE
WHERE role IN ('owner', 'admin');

