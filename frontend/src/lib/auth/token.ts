import { getApiBaseUrl } from "@/lib/api/api-base-url";
import { syncSessionCookie } from "./session-cookie";

const TOKEN_KEY = "token";
/** Kada „Zapamti me“ nije uključen, token živi samo u sesiji taba. */
const SESSION_TOKEN_KEY = "token_session";

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return (
    window.localStorage.getItem(TOKEN_KEY) ??
    window.sessionStorage.getItem(SESSION_TOKEN_KEY)
  );
}

/**
 * @deprecated JWT je u httpOnly kolačiću; pozovi `syncSessionCookie(true)` posle uspešnog login-a.
 */
export function setToken(_token: string, remember = true): void {
  if (typeof window === "undefined") {
    return;
  }
  syncSessionCookie(true);
  void _token;
  void remember;
}

export function clearToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
  syncSessionCookie(false);
  void fetch(`${getApiBaseUrl()}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});
}

export function hasToken(): boolean {
  return Boolean(getToken());
}
