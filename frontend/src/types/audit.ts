export type AuditLogRow = {
  id: string;
  user_id: number | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  meta: Record<string, unknown>;
  created_at: string;
  actor_email: string | null;
};
