export type ExpenseRow = {
  id: number;
  organization_id: number;
  amount_rsd: number;
  title: string;
  category: string | null;
  notes: string | null;
  spent_at: string;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
};

export type CreateExpenseBody = {
  title: string;
  amount_rsd: number;
  category?: string | null;
  notes?: string | null;
  spent_at: string;
};

export type UpdateExpenseBody = Partial<CreateExpenseBody>;
