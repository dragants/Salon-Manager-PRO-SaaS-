import axios from "axios";
import type { AxiosError } from "axios";
import { clearToken } from "@/lib/auth/token";
import { getApiBaseUrl } from "@/lib/api/api-base-url";

/** Bez ovoga završeni zahtev koji „visi” drži ceo UI u „Učitavanje…”. */
const REQUEST_TIMEOUT_MS = 15_000;

export const api = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
  /** httpOnly JWT kolačić + CORS `credentials` na backendu. */
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  if (typeof window === "undefined") {
    return config;
  }
  /** Privremena podrška za stare sesije u localStorage/sessionStorage (migracija). */
  const legacy =
    window.localStorage.getItem("token") ??
    window.sessionStorage.getItem("token_session");
  if (legacy) {
    config.headers.Authorization = `Bearer ${legacy}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ code?: string }>) => {
    if (typeof window === "undefined") {
      return Promise.reject(err);
    }
    if (err.response?.status === 401) {
      const code = err.response.data?.code;
      if (code === "SESSION_REVOKED") {
        clearToken();
        const path = `${window.location.pathname}${window.location.search}`;
        if (!path.startsWith("/login")) {
          window.location.assign("/login?reason=session_revoked");
        }
      }
    }
    if (err.response?.status === 403) {
      const code = err.response.data?.code;
      if (code === "MFA_REQUIRED") {
        const path = `${window.location.pathname}${window.location.search}`;
        if (!path.startsWith("/mfa")) {
          window.location.assign("/mfa");
        }
      }
      if (code === "SUBSCRIPTION_REQUIRED") {
        const path = `${window.location.pathname}${window.location.search}`;
        if (!path.startsWith("/subscribe")) {
          window.location.assign("/subscribe");
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
