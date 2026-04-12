export type DashboardSummary = {
  todayAppointments: number;
  nextAppointment: string | null;
  /** Samo za administratore salona. */
  revenue?: number;
  clients?: number;
};
