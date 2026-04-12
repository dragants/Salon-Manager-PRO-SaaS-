/**
 * Bazni URL backend API-ja (port 5000).
 * - `NEXT_PUBLIC_API_URL` — fiksni URL (npr. produkcija).
 * - U browseru bez env-a: isti host kao Next (npr. http://192.168.1.5:3000 → API na :5000).
 * - Ako je u env-u `localhost`, a stranica je otvorena preko LAN IP-a, automatski se koristi
 *   isti host kao u adresnoj traci (inače zahtevi idu na „localhost” na drugom uređaju i vise).
 * - Na Next serveru (SSR): 127.0.0.1.
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const pageHost = window.location.hostname;
    const pageIsLan =
      pageHost !== "localhost" && pageHost !== "127.0.0.1";
    if (fromEnv && pageIsLan) {
      try {
        const u = new URL(fromEnv);
        const envHost = u.hostname;
        if (envHost === "localhost" || envHost === "127.0.0.1") {
          const port = u.port || "5000";
          const protocol = window.location.protocol || "http:";
          const rewritten = `${protocol}//${pageHost}:${port}`;
          if (process.env.NODE_ENV === "development") {
            console.info(
              "[api] NEXT_PUBLIC_API_URL pokazuje na localhost; na LAN-u koristim:",
              rewritten
            );
          }
          return rewritten;
        }
      } catch {
        /* ignore broken NEXT_PUBLIC_API_URL */
      }
    }
  }

  if (fromEnv) {
    return fromEnv;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return "http://127.0.0.1:5000";
}
