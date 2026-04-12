/** Cookie koji Next.js proxy (bivši middleware) koristi kao signal da klijent verovatno ima JWT u localStorage. */
export const SESSION_COOKIE_NAME = "salon_session";

/**
 * Postavi ili obriši kratkotrajni cookie (isti max-age kao praktičan JWT prozor).
 * Pozivati samo u browseru (nakon login / logout).
 */
export function syncSessionCookie(present: boolean): void {
  if (typeof document === "undefined") {
    return;
  }
  const maxAge = present ? 60 * 60 * 24 * 7 : 0;
  const value = present ? "1" : "";
  document.cookie = `${SESSION_COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
