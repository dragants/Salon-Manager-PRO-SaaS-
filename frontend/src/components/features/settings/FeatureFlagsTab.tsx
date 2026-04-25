"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "./SettingsCard";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getFeatureFlagsCatalog,
  getMyFeatureFlags,
  patchMyFeatureFlags,
  type FeatureFlagCatalogItem,
} from "@/lib/api";

type Row = FeatureFlagCatalogItem & { enabled: boolean };

export function FeatureFlagsTab() {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<FeatureFlagCatalogItem[]>([]);
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const [cat, mine] = await Promise.all([
          getFeatureFlagsCatalog(),
          getMyFeatureFlags(),
        ]);
        if (cancelled) return;
        setCatalog(cat);
        setFlags(mine.flags);
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e, "Greška pri učitavanju."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo<Row[]>(() => {
    const fromCatalog = catalog.map((c) => ({
      ...c,
      enabled:
        typeof flags[c.key] === "boolean" ? flags[c.key] : c.default_enabled,
    }));
    // In case tenant has flags not in catalog (should be rare, but safe):
    for (const [k, v] of Object.entries(flags)) {
      if (!fromCatalog.some((x) => x.key === k)) {
        fromCatalog.push({
          key: k,
          description: null,
          default_enabled: false,
          enabled: Boolean(v),
        });
      }
    }
    return fromCatalog.sort((a, b) => a.key.localeCompare(b.key));
  }, [catalog, flags]);

  async function toggleFlag(key: string, enabled: boolean) {
    setError(null);
    setSavingKey(key);
    const prev = flags;
    const nextLocal = { ...flags, [key]: enabled };
    setFlags(nextLocal);
    try {
      const res = await patchMyFeatureFlags({ [key]: enabled });
      setFlags(res.flags);
    } catch (e) {
      setFlags(prev);
      setError(getApiErrorMessage(e, "Ne mogu da sačuvam flag."));
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Feature flags (po salonu)"
        description="Eksperimentalne funkcije možeš uključivati po tenantu bez deploy-a. Preporuka: pali prvo na jednom salonu, pa širi."
      >
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Učitavanje…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nema flagova. Prvi put se pojave kad ih upišeš kroz API.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.key}
                className="flex flex-col gap-3 rounded-xl border border-border/90 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {r.key}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.description || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={r.enabled ? "default" : "outline"}
                    disabled={savingKey === r.key}
                    onClick={() => void toggleFlag(r.key, true)}
                  >
                    ON
                  </Button>
                  <Button
                    type="button"
                    variant={!r.enabled ? "default" : "outline"}
                    disabled={savingKey === r.key}
                    onClick={() => void toggleFlag(r.key, false)}
                  >
                    OFF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsCard>
    </div>
  );
}

