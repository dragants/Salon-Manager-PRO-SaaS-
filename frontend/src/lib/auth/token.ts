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
 * @param remember false — zatvori tab / sesiju i token nestaje (sessionStorage).
 */
export function setToken(token: string, remember = true): void {
  if (typeof window === "undefined") {
    return;
  }
  if (remember) {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } else {
    window.sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    window.localStorage.removeItem(TOKEN_KEY);
  }
  syncSessionCookie(true);
}

export function clearToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
  syncSessionCookie(false);
}

export function hasToken(): boolean {
  return Boolean(getToken());
}
