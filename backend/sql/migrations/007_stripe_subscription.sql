-- Stripe pretplata po salonu (organizacija).
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Postojeći saloni: pristup bez promene ponašanja dok ne uključiš SUBSCRIPTION_ENFORCED=true
UPDATE organizations
SET subscription_status = 'active'
WHERE subscription_status IS NULL;

ALTER TABLE organizations
  ALTER COLUMN subscription_status SET DEFAULT 'inactive';
