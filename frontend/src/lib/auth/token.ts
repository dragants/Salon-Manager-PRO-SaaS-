import { syncSessionCookie } from "./session-cookie";

const TOKEN_KEY = "token";

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  syncSessionCookie(true);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  syncSessionCookie(false);
}

export function hasToken(): boolean {
  return Boolean(getToken());
}
