import type {
  AppointmentRow,
  AppointmentsByDayParams,
  AppointmentsByRangeParams,
} from "@/types/appointment";
import type { AuditLogRow } from "@/types/audit";
import type { AuthTokenResponse, LoginBody, RegisterBody } from "@/types/auth";
import type { Client, ClientDetail } from "@/types/client";
import type { AnalyticsResponse } from "@/types/analytics";
import type { DashboardSummary } from "@/types/dashboard";
import type { OrganizationSettings } from "@/types/organization";
import type { Service } from "@/types/service";
import type { BillingStatus } from "@/types/billing";
import type { AvailabilitySlotDto, WorkShiftRow } from "@/types/shift";
import type {
  CreateExpenseBody,
  ExpenseRow,
  UpdateExpenseBody,
} from "@/types/expense";
import type { MeUser, OrgTeamMember, PatchTeamMemberBody } from "@/types/user";
import { api } from "./client";
import {
  appointmentsCacheKey,
  cachedGet,
  invalidateByScope,
} from "./request-cache";

export { api } from "./client";
export { invalidateByScope, invalidateApiCache } from "./request-cache";
export default api;

export function login(data: LoginBody) {
  return api.post<AuthTokenResponse>("/auth/login", data);
}

export function register(data: RegisterBody) {
  return api.post<AuthTokenResponse>("/auth/register", data);
}

export function requestPasswordReset(email: string) {
  return api.post<{ ok: boolean; message?: string }>("/auth/forgot-password", {
    email,
  });
}

export function resetPasswordWithToken(token: string, password: string) {
  return api.post<{ ok: boolean; message?: string }>("/auth/reset-password", {
    token,
    password,
  });
}

export function getClients() {
  return cachedGet("clients", 40_000, () => api.get<Client[]>("/clients"));
}

export type CreateClientBody = {
  name: string;
  phone: string;
  /** Za e-mail podsetnike / potvrde termina. */
  email?: string | null;
  notes?: string;
};

export function createClient(data: CreateClientBody) {
  return api.post<Client>("/clients", data).then((r) => {
    invalidateByScope("clients");
    return r;
  });
}

export function getClientDetail(id: number) {
  return api.get<ClientDetail>(`/clients/${id}/detail`);
}

export type UpdateClientBody = {
  name?: string;
  phone?: string;
  email?: string | null;
  notes?: string | null;
};

export function updateClient(id: number, data: UpdateClientBody) {
  return api.patch<Client>(`/clients/${id}`, data).then((r) => {
    invalidateByScope("clients");
    return r;
  });
}

export function deleteClient(id: number) {
  return api.delete<{ success: boolean }>(`/clients/${id}`).then((r) => {
    invalidateByScope("clients");
    return r;
  });
}

export type ClientChartFilePayload = {
  filename: string;
  mime_type: string;
  data_base64: string;
};

export type CreateClientChartBody = {
  visit_at?: string;
  title?: string | null;
  notes?: string | null;
  appointment_id?: number | null;
  files?: ClientChartFilePayload[];
};

export function createClientChartEntry(
  clientId: number,
  data: CreateClientChartBody
) {
  return api.post<unknown>(`/clients/${clientId}/chart`, data);
}

export async function downloadClientChartFile(
  clientId: number,
  fileId: number
): Promise<Blob> {
  const { data } = await api.get<Blob>(
    `/clients/${clientId}/chart/files/${fileId}`,
    { responseType: "blob" }
  );
  return data;
}

export function getAppointments(
  params: AppointmentsByDayParams | AppointmentsByRangeParams
) {
  const flat: Record<string, string | undefined> =
    "day" in params
      ? { day: params.day, timezone: params.timezone }
      : { from: params.from, to: params.to, timezone: params.timezone };
  const key = appointmentsCacheKey(flat);
  return cachedGet(key, 20_000, () =>
    api.get<AppointmentRow[]>("/appointments", { params })
  );
}

export function createAppointment(data: {
  client_id: number;
  service_id: number;
  date: string;
  staff_user_id?: number | null;
  send_sms?: boolean;
  send_whatsapp?: boolean;
  send_email?: boolean;
}) {
  return api
    .post<{ appointment: AppointmentRow; notifications: unknown }>(
      "/appointments",
      data
    )
    .then((r) => {
      invalidateByScope("stats");
      return r;
    });
}

export function patchAppointment(
  id: number,
  data: {
    client_id?: number;
    service_id?: number;
    date?: string;
    status?: AppointmentRow["status"];
    staff_user_id?: number | null;
  }
) {
  return api.patch<AppointmentRow>(`/appointments/${id}`, data).then((r) => {
    invalidateByScope("stats");
    return r;
  });
}

export function deleteAppointment(id: number) {
  return api.delete<void>(`/appointments/${id}`).then((r) => {
    invalidateByScope("stats");
    return r;
  });
}

export function getSettings() {
  return cachedGet("org-settings", 45_000, () =>
    api.get<OrganizationSettings>("/organizations/me/settings")
  );
}

export function getBillingStatus() {
  return api.get<BillingStatus>("/billing/status");
}

export async function startBillingCheckout(): Promise<{ url: string }> {
  const { data } = await api.post<{ url: string }>("/billing/checkout");
  return data;
}

export async function openBillingPortal(): Promise<{ url: string }> {
  const { data } = await api.post<{ url: string }>("/billing/portal");
  return data;
}

export type PatchOrgSettingsBody = {
  name?: string;
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
  theme_color?: string | null;
  timezone?: string | null;
  /** Samo mala slova, brojevi i crtice; prazan string briše link. */
  booking_slug?: string | null;
  reminders?: {
    dayBefore?: boolean;
    twoHoursBefore?: boolean;
    dayBeforeHour?: number | null;
    customReminderHours?: number | null;
    channelSms?: boolean;
    channelWhatsApp?: boolean;
    channelEmail?: boolean;
    noShowFollowup?: boolean;
  };
  working_hours?: Record<string, unknown> | null;
  /** Spaja se u organizations.settings (jsonb). */
  settings?: Record<string, unknown>;
};

export function patchSettings(data: PatchOrgSettingsBody) {
  return api.patch<unknown>("/organizations/me/settings", data).then((r) => {
    invalidateByScope("stats");
    return r;
  });
}

export function getExpenses(params: { from: string; to: string }) {
  return api.get<ExpenseRow[]>("/expenses", { params });
}

export function createExpense(data: CreateExpenseBody) {
  return api.post<ExpenseRow>("/expenses", data);
}

export function updateExpense(id: number, data: UpdateExpenseBody) {
  return api.patch<ExpenseRow>(`/expenses/${id}`, data);
}

export function deleteExpense(id: number) {
  return api.delete<void>(`/expenses/${id}`);
}

export function getServices() {
  return cachedGet("services", 60_000, () => api.get<Service[]>("/services"));
}

export function createService(data: {
  name: string;
  price: number;
  duration?: number;
  buffer_minutes?: number;
}) {
  return api.post<Service>("/services", data).then((r) => {
    invalidateByScope("services");
    return r;
  });
}

export type UpdateServiceBody = {
  name?: string;
  price?: number;
  duration?: number;
  buffer_minutes?: number;
};

export function updateService(id: number, data: UpdateServiceBody) {
  return api.patch<Service>(`/services/${id}`, data).then((r) => {
    invalidateByScope("services");
    return r;
  });
}

export function getDashboard() {
  return cachedGet("dashboard", 35_000, () =>
    api.get<DashboardSummary>("/dashboard")
  );
}

export function getAnalytics() {
  return cachedGet("analytics", 45_000, () =>
    api.get<AnalyticsResponse>("/analytics")
  );
}

export function getMe() {
  return api.get<MeUser>("/users/me");
}

export type ChangePasswordBody = {
  current_password: string;
  new_password: string;
};

export function changeMyPassword(data: ChangePasswordBody) {
  return api.patch<{ ok: boolean }>("/users/me/password", data);
}

export type PushConfigResponse = { vapid_public_key: string | null };

export function getPushConfig() {
  return api.get<PushConfigResponse>("/users/me/push-config");
}

export function subscribePush(body: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number | null;
}) {
  return api.post<{ ok: boolean }>("/users/me/push-subscription", body);
}

export function unsubscribePush(endpoint?: string | null) {
  const ep = endpoint && String(endpoint).trim();
  return api.post<{ ok: boolean }>(
    "/users/me/push-unsubscribe",
    ep ? { endpoint: ep } : {}
  );
}

export function sendPushTest() {
  return api.post<{ sent: number; skipped?: string }>("/users/me/push-test");
}

export type GetAuditLogParams = {
  limit?: number;
  /** Filtriraj po kodu akcije (npr. settings_patch). */
  action?: string;
};

export function getAuditLog(params: GetAuditLogParams = {}) {
  const { limit = 200, action } = params;
  return api.get<AuditLogRow[]>("/audit", {
    params: {
      limit,
      ...(action ? { action } : {}),
    },
  });
}

export function getOrgTeam() {
  return api.get<OrgTeamMember[]>("/users");
}

export type CreateTeamMemberBody = {
  email: string;
  password: string;
  role: "admin" | "worker";
  display_name?: string | null;
};

export function createTeamMember(data: CreateTeamMemberBody) {
  return api.post<OrgTeamMember>("/users", data);
}

export function patchTeamMember(id: number, data: PatchTeamMemberBody) {
  return api.patch<OrgTeamMember>(`/users/${id}`, data);
}

export function deleteTeamMember(id: number) {
  return api.delete(`/users/${id}`);
}

export function getAvailability(params: {
  day: string;
  service_id: number;
  staff_user_id?: number;
}) {
  return api.get<{
    slots: AvailabilitySlotDto[];
    timezone: string;
    from_shifts: boolean;
  }>("/availability", { params });
}

export function getWorkShifts(day: string, timezone?: string) {
  return api.get<{ shifts: WorkShiftRow[] }>("/shifts", {
    params: { day, ...(timezone ? { timezone } : {}) },
  });
}

export type ReplaceWorkShiftsBody = {
  shifts: { user_id: number; start: string; end: string }[];
};

export function replaceWorkShifts(
  day: string,
  body: ReplaceWorkShiftsBody,
  timezone?: string
) {
  return api.put<{ ok: boolean; shifts: WorkShiftRow[] }>("/shifts", body, {
    params: { day, ...(timezone ? { timezone } : {}) },
  });
}
