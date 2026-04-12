export type AppointmentStatus = "scheduled" | "completed" | "no_show";

export type AppointmentRow = {
  id: number;
  client_id: number;
  service_id: number;
  date: string;
  status: AppointmentStatus;
  client_name?: string;
  service_name?: string;
  service_duration?: number;
  service_price?: string | number;
  staff_user_id?: number | null;
  staff_email?: string | null;
  staff_display_name?: string | null;
};

export type AppointmentsByDayParams = {
  day: string;
  timezone: string;
};

export type AppointmentsByRangeParams = {
  from: string;
  to: string;
  timezone: string;
};
