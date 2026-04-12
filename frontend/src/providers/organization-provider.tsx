"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getSettings } from "@/lib/api";
import type { OrganizationSettings } from "@/types/organization";
import { useAuth } from "./auth-provider";

type OrganizationContextValue = {
  settings: OrganizationSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(
  null
);

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      return;
    }
    setLoading(true);
    try {
      const { data } = await getSettings();
      setSettings(data);
    } catch {
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }
    void refreshSettings();
  }, [user, authLoading, refreshSettings]);

  return (
    <OrganizationContext.Provider
      value={{ settings, loading, refreshSettings }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrganizationContextValue {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    throw new Error("useOrganization mora biti unutar OrganizationProvider.");
  }
  return ctx;
}
