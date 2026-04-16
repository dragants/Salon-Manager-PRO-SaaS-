export type BillingPlanId = "free" | "basic" | "pro";

export type ClientLimitState = {
  enforced: boolean;
  tier: "free" | "paid";
  plan: BillingPlanId;
  max_clients: number | null;
  current_clients: number;
  at_limit: boolean;
};

export type AppointmentLimitState = {
  enforced: boolean;
  tier: "free" | "paid";
  plan: BillingPlanId;
  timezone: string;
  max_appointments_month: number | null;
  current_appointments_month: number;
  at_limit: boolean;
};

export type BillingStatus = {
  subscription_status: string | null;
  billing_plan?: BillingPlanId;
  has_customer: boolean;
  has_subscription: boolean;
  subscription_enforced: boolean;
  plan_limits_enforced?: boolean;
  client_limits?: ClientLimitState | null;
  appointment_limits?: AppointmentLimitState | null;
};
