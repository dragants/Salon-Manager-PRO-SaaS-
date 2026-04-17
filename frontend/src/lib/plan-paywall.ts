/**
 * Kodovi grešaka sa API-ja — otvaranje globalnog paywall modala.
 * Razdvojeno po kontekstu da „dodaj klijenta“ ne reaguje na limit termina i obrnuto.
 */
export const PLAN_LIMIT_CLIENT_CODES = [
  "PLAN_CLIENT_LIMIT",
  "PLAN_LIMIT_REACHED",
] as const;

export const PLAN_LIMIT_APPOINTMENT_CODES = [
  "PLAN_APPOINTMENT_MONTH_LIMIT",
  "PLAN_LIMIT_REACHED",
] as const;

export function isPlanLimitClientCode(code: string | undefined): boolean {
  return (
    code != null && (PLAN_LIMIT_CLIENT_CODES as readonly string[]).includes(code)
  );
}

export function isPlanLimitAppointmentCode(code: string | undefined): boolean {
  return (
    code != null &&
    (PLAN_LIMIT_APPOINTMENT_CODES as readonly string[]).includes(code)
  );
}
