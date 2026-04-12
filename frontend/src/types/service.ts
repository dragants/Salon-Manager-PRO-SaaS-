export type Service = {
  id: number;
  organization_id: number;
  name: string;
  price: string | number;
  duration: number;
  buffer_minutes?: number;
  created_at: string;
};
