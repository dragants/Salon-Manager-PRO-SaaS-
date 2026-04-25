"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsCard } from "./SettingsCard";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getFeatureFlagsCatalog,
  getMyFeatureFlags,
  patchMyFeatureFlags,
  type FeatureFlagCatalogItem,
} from "@/lib/api";

type Row = FeatureFlagCatalogItem & { enabled: boolean };

function normalizeNewFlagKey(raw: string): string | null {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  if (!s || s.length > 64) return null;
  if (!/^[a-z]/.test(s)) return null;
  return s;
}

export function FeatureFlagsTab() {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<FeatureFlagCatalogItem[]>([]);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState("");

  const reload = useCallback(async () => {
    const [cat, mine] = await Promise.all([
      getFeatureFlagsCatalog(),
      getMyFeatureFlags(),
    ]);
    setCatalog(cat);
    setFlags(mine.flags);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        await reload();
        if (cancelled) return;
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e, "Greška pri učitavanju."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

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

  async function addNewFlag(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const key = normalizeNewFlagKey(newKey);
    if (!key) {
      setError(
        "Ključ: 1–64 znaka, počinje malim slovom, samo a–z, cifre i donja crta."
      );
      return;
    }
    setAdding(true);
    try {
      await patchMyFeatureFlags({ [key]: false });
      setNewKey("");
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, "Ne mogu da dodam flag."));
    } finally {
      setAdding(false);
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

        <form
          onSubmit={(ev) => void addNewFlag(ev)}
          className="flex flex-col gap-3 rounded-xl border border-border/90 bg-muted/30 p-4 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="new-flag-key">Novi flag (ključ)</Label>
            <Input
              id="new-flag-key"
              placeholder="npr. experimental_booking"
              value={newKey}
              onChange={(ev) => setNewKey(ev.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Dodaje se u katalog kao <strong className="text-foreground">OFF</strong> za
              ovaj salon; posle ga pališ/gasiš ispod. Isto radi i{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                PATCH /feature-flags/me
              </code>{" "}
              sa <code className="rounded bg-muted px-1 py-0.5 text-[11px]">flags</code>.
            </p>
          </div>
          <Button type="submit" variant="secondary" disabled={adding || loading}>
            {adding ? "Dodajem…" : "Dodaj flag"}
          </Button>
        </form>

        {loading ? (
          <p className="text-sm text-muted-foreground">Učitavanje…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Još nema ključeva u katalogu — dodaj prvi gore (ili{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              PATCH /feature-flags/me
            </code>
            ).
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

