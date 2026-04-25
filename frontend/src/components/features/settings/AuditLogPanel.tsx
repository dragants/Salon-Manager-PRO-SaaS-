"use client";
import { useT } from "@/lib/i18n/locale";

import { useCallback, useEffect, useState } from "react";
import { getAuditLog } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AuditLogRow } from "@/types/audit";
import { SettingsCard } from "./SettingsCard";

const ACTION_LABEL: Record<string, string> = {
  password_change: "Promena lozinke",
  client_delete: "Brisanje klijenta",
  appointment_delete: "Brisanje termina",
  team_member_create: "Novi član tima",
  team_member_update: "Izmena člana tima",
  team_member_delete: "Brisanje člana tima",
  settings_patch: "Izmene podešavanja salona",
  service_create: "Nova usluga",
  service_update: "Izmena usluge",
  service_delete: "Brisanje usluge",
  payment_create: "Nova uplata",
};

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Sve radnje" },
  { value: "password_change", label: ACTION_LABEL.password_change },
  { value: "client_delete", label: ACTION_LABEL.client_delete },
  { value: "appointment_delete", label: ACTION_LABEL.appointment_delete },
  { value: "team_member_create", label: ACTION_LABEL.team_member_create },
  { value: "team_member_update", label: ACTION_LABEL.team_member_update },
  { value: "team_member_delete", label: ACTION_LABEL.team_member_delete },
  { value: "settings_patch", label: ACTION_LABEL.settings_patch },
  { value: "service_create", label: ACTION_LABEL.service_create },
  { value: "service_update", label: ACTION_LABEL.service_update },
  { value: "service_delete", label: ACTION_LABEL.service_delete },
  { value: "payment_create", label: ACTION_LABEL.payment_create },
];

const TABLE_LIMIT = 200;

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("sr-Latn-RS", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadAuditCsv(rows: AuditLogRow[], filterTag: string) {
  const header = [
    "vreme",
    "radnja",
    "akcija",
    "email",
    "entitet",
    "entitet_id",
    "meta_json",
  ];
  const lines = [
    header.join(";"),
    ...rows.map((r) =>
      [
        formatTime(r.created_at),
        ACTION_LABEL[r.action] ?? r.action,
        r.action,
        r.actor_email ?? "",
        r.entity_type ?? "",
        r.entity_id != null ? String(r.entity_id) : "",
        JSON.stringify(r.meta ?? {}),
      ]
        .map((c) => csvEscape(c))
        .join(";")
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const suffix = filterTag === "all" ? "sve" : filterTag;
  a.download = `audit-salon-${suffix}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AuditLogPanel() {
  const t = useT();
  const [rows, setRows] = useState<AuditLogRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    setRows(null);
    try {
      const { data } = await getAuditLog({
        limit: TABLE_LIMIT,
        ...(actionFilter !== "all" ? { action: actionFilter } : {}),
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(getApiErrorMessage(e, "Evidencija nije učitana."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onExportCsv() {
    setExporting(true);
    setError(null);
    try {
      const { data } = await getAuditLog({
        limit: TABLE_LIMIT,
        ...(actionFilter !== "all" ? { action: actionFilter } : {}),
      });
      const list = Array.isArray(data) ? data : [];
      if (list.length === 0) {
        setError("Nema podataka za izvoz uz trenutni filter.");
        return;
      }
      downloadAuditCsv(list, actionFilter);
    } catch (e) {
      setError(getApiErrorMessage(e, "CSV nije preuzet."));
    } finally {
      setExporting(false);
    }
  }

  return (
    <SettingsCard
      title="Evidencija radnji"
      description="Do 200 poslednjih zapisa. Filtriraj po vrsti radnje i preuzmi CSV (isti filter, do 200 redova). Vidi samo administrator."
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="audit-filter" className="text-foreground">
            Filter
          </Label>
          <select
            id="audit-filter"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            disabled={loading}
            className="flex h-10 min-w-[200px] rounded-md border border-border bg-card px-3 text-sm text-foreground"
          >
            {FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-border"
          disabled={loading || exporting}
          onClick={() => void onExportCsv()}
        >
          {exporting ? "Priprema…" : "Preuzmi CSV"}
        </Button>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Učitavanje…</p>
      ) : !error && rows && rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nema zapisa za ovaj filter.</p>
      ) : null}

      {!loading && rows && rows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border/90">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/80 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">Vreme</th>
                <th className="px-3 py-2 font-medium">Radnja</th>
                <th className="px-3 py-2 font-medium">Ko</th>
                <th className="px-3 py-2 font-medium">Detalj</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map((r) => (
                <tr key={r.id} className="bg-card">
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-foreground">
                    {formatTime(r.created_at)}
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    {ACTION_LABEL[r.action] ?? r.action}
                  </td>
                  <td className="max-w-[140px] truncate px-3 py-2 text-foreground">
                    {r.actor_email ?? "—"}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-xs text-muted-foreground">
                    {r.entity_type && r.entity_id != null
                      ? `${r.entity_type} #${r.entity_id}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </SettingsCard>
  );
}
