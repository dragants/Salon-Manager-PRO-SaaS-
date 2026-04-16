"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getSettings, patchSettings } from "@/lib/api";
import type { PatchOrgSettingsBody } from "@/lib/api";
import { mergeOrgSettingsPreview } from "@/lib/merge-org-settings-preview";
import type { OrganizationSettings } from "@/types/organization";
import { useAuth } from "./auth-provider";

type OrganizationContextValue = {
  settings: OrganizationSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  /** Optimistički merge u UI, rollback pri grešci; posle uspeha pun refresh sa servera. */
  patchSettingsWithOptimism: (body: PatchOrgSettingsBody) => Promise<void>;
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

  const patchSettingsWithOptimism = useCallback(
    async (body: PatchOrgSettingsBody) => {
      if (!user) {
        throw new Error("Niste prijavljeni.");
      }
      const prev = settings;
      if (prev) {
        setSettings(mergeOrgSettingsPreview(prev, body));
      }
      try {
        await patchSettings(body);
        const { data } = await getSettings();
        setSettings(data);
      } catch (err) {
        setSettings(prev);
        throw err;
      }
    },
    [user, settings]
  );

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
      value={{
        settings,
        loading,
        refreshSettings,
        patchSettingsWithOptimism,
      }}
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
