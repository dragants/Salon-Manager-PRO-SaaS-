export type AnalyticsChartPoint = {
  day: string;
  count: number;
};

export type AnalyticsSeriesPoint = {
  day: string;
  appointments: number;
  revenue: number;
};

export type AnalyticsTopService = {
  id: number;
  name: string;
  booking_count: number;
  revenue: number;
};

export type AnalyticsTopClient = {
  id: number;
  name: string;
  visits: number;
  revenue: number;
};

export type AnalyticsResponse = {
  revenue_month: number | null;
  revenue_today: number | null;
  appointments_today: number;
  appointments_total: number;
  clients: number;
  no_show_percent: number;
  series7: AnalyticsSeriesPoint[];
  series30: AnalyticsSeriesPoint[];
  chart: AnalyticsChartPoint[];
  revenue: number | null;
  appointments: number;
  top_services: AnalyticsTopService[];
  top_clients: AnalyticsTopClient[];
  _meta?: { financials?: boolean };
};
