-- 024: Stripe subscriptions table (SaaS)
-- Keep separate from existing Paddle Classic columns on `organizations`.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id INTEGER GENERATED ALWAYS AS (organization_id) STORED,

  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  plan TEXT,
  status TEXT,
  current_period_end TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (organization_id),
  UNIQUE (stripe_customer_id),
  UNIQUE (stripe_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_tenant
  ON stripe_subscriptions (tenant_id);

