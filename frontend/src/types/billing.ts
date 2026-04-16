export type ClientLimitState = {
  enforced: boolean;
  tier: "free" | "paid";
  max_clients: number | null;
  current_clients: number;
  at_limit: boolean;
};

export type BillingStatus = {
  subscription_status: string | null;
  has_customer: boolean;
  has_subscription: boolean;
  subscription_enforced: boolean;
  plan_limits_enforced?: boolean;
  client_limits?: ClientLimitState | null;
};
