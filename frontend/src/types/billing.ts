export type BillingStatus = {
  subscription_status: string | null;
  has_customer: boolean;
  has_subscription: boolean;
  subscription_enforced: boolean;
};
