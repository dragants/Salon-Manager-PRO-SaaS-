-- Javna stranica za rezervacije: /book/{slug}
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS booking_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_booking_slug_lower
  ON organizations (lower(booking_slug))
  WHERE booking_slug IS NOT NULL AND btrim(booking_slug) <> '';
