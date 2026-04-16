export type SupplyItem = {
  id: number;
  organization_id: number;
  name: string;
  unit: string;
  quantity: number;
  reorder_min: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplyMovement = {
  id: number;
  supply_item_id: number;
  item_name: string | null;
  delta_qty: number;
  movement_type: "purchase" | "usage" | "adjustment";
  note: string | null;
  appointment_id: number | null;
  created_at: string;
};

export type CreateSupplyItemBody = {
  name: string;
  unit?: string;
  reorder_min?: number | null;
  notes?: string | null;
};

export type PatchSupplyItemBody = Partial<CreateSupplyItemBody>;

export type CreateSupplyMovementBody = {
  supply_item_id: number;
  movement_type: "purchase" | "usage" | "adjustment";
  quantity?: number;
  target_quantity?: number;
  note?: string | null;
  appointment_id?: number | null;
};

export type SupplyMovementResult = {
  skipped: boolean;
  item: SupplyItem | null;
  movement: SupplyMovement | null;
};
