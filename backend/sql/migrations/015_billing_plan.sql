-- Plan za monetizaciju (limiti klijenata / termina po mesecu).
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS billing_plan TEXT NOT NULL DEFAULT 'free';

ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_billing_plan_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_billing_plan_check
  CHECK (billing_plan IN ('free', 'basic', 'pro'));

-- Postojeći aktivni saloni: tretiraj kao Basic dok ne podesiš PADDLE_PRO_PRODUCT_IDS.
UPDATE organizations
SET billing_plan = 'basic'
WHERE subscription_status IN ('active', 'trialing')
  AND billing_plan = 'free';
