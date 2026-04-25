-- 025: Stripe webhook idempotency table
-- Prevent double-processing of Stripe webhook events.

CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

