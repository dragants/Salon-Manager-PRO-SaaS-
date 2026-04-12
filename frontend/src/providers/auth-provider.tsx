"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { api } from "@/lib/api/client";
import { clearToken, getToken } from "@/lib/auth/token";
import { syncSessionCookie } from "@/lib/auth/session-cookie";
import type { MeUser } from "@/types/user";

type AuthContextValue = {
  user: MeUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        syncSessionCookie(false);
        setUser(null);
        setLoading(false);
        return;
      }
      syncSessionCookie(true);
      setLoading(true);
      try {
        const { data } = await api.get<MeUser>("/users/me");
        setUser(data);
      } catch (e) {
        /**
         * Bilo koja greška na /users/me sa tokenom u localStorage inače pravi petlju:
         * login/početna vide token → šalju na /dashboard → AuthGuard opet puca → nazad na login.
         * 403 ostaje posebno (npr. subscribe tok; za /users/me trenutno ne važi zbog bypass-a).
         */
        if (axios.isAxiosError(e)) {
          const st = e.response?.status;
          if (st !== 403) {
            clearToken();
          }
        } else {
          clearToken();
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    } catch {
      setUser(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth mora biti unutar AuthProvider.");
  }
  return ctx;
}
