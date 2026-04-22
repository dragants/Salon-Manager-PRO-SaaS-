export type Service = {
  id: number;
  organization_id: number;
  name: string;
  price: string | number;
  duration: number;
  buffer_minutes?: number;
  category_id?: number | null;
  category_name?: string | null;
  color?: string | null;
  description?: string | null;
  created_at: string;
};

export type ServiceCategory = {
  id: number;
  organization_id: number;
  name: string;
  sort_order: number;
  created_at: string;
};
