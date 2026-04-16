import type { ClientLoyaltyBalance } from "./loyalty";

export type Client = {
  id: number;
  organization_id: number;
  name: string;
  phone: string | null;
  email?: string | null;
  notes: string | null;
  created_at: string;
};

export type ClientAppointmentHistory = {
  id: number;
  date: string;
  status: string;
  service_name: string;
  duration: number;
  staff_user_id?: number | null;
  staff_display_name?: string | null;
  staff_email?: string | null;
};

export type ClientChartAttachmentMeta = {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
};

export type ClientChartEntry = {
  id: number;
  visit_at: string;
  title: string | null;
  notes: string | null;
  appointment_id: number | null;
  created_at: string;
  attachments: ClientChartAttachmentMeta[];
};

export type ClientDetail = {
  client: Client;
  appointments: ClientAppointmentHistory[];
  chart_entries: ClientChartEntry[];
  /** Popunjava se ako postoji loyalty modul u bazi. */
  loyalty_balances?: ClientLoyaltyBalance[];
};
