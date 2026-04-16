export type LoyaltyProgram = {
  id: number;
  organization_id: number;
  service_id: number;
  service_name: string;
  name: string;
  visits_required: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ClientLoyaltyBalance = {
  program_id: number;
  program_name: string;
  service_id: number;
  service_name: string;
  visits_required: number;
  stamps: number;
  rewards_available: number;
};

export type LoyaltyEligibilityRow = {
  program_id: number;
  name: string;
  visits_required: number;
  stamps: number;
  rewards_available: number;
};

export type CreateLoyaltyProgramBody = {
  service_id: number;
  name: string;
  visits_required: number;
  is_active?: boolean;
};

export type PatchLoyaltyProgramBody = Partial<{
  name: string;
  visits_required: number;
  is_active: boolean;
}>;
