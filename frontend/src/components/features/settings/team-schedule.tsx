"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Save } from "lucide-react";
import { patchTeamMember } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  DAY_DEFINITIONS,
  type DayId,
  type DayScheduleRow,
  parseWorkingHoursFromApi,
  workingHoursToPayload,
} from "@/components/features/settings/working-hours-editor";
import type { OrgTeamMember } from "@/types/user";

const ACCENT_BORDER = [
  "border-l-sky-500",
  "border-l-emerald-500",
  "border-l-violet-500",
  "border-l-amber-500",
] as const;

function copyMondayToWeek(rows: DayScheduleRow[]): DayScheduleRow[] {
  const mon = rows.find((r) => r.id === "mon");
  if (!mon) {
    return rows;
  }
  return rows.map((r) =>
    r.id === "mon"
      ? r
      : {
          ...r,
          enabled: mon.enabled,
          open: mon.open,
          close: mon.close,
          breakStart: mon.breakStart,
          breakEnd: mon.breakEnd,
        }
  );
}

function patchDay(
  rows: DayScheduleRow[],
  dayId: DayId,
  patch: Partial<DayScheduleRow>
): DayScheduleRow[] {
  return rows.map((r) => (r.id === dayId ? { ...r, ...patch } : r));
}

type TeamScheduleTabProps = {
  team: OrgTeamMember[];
  teamLoading: boolean;
  isAdmin: boolean;
  onTeamChanged: () => void;
};

export function TeamScheduleTab({
  team,
  teamLoading,
  isAdmin,
  onTeamChanged,
}: TeamScheduleTabProps) {
  const [drafts, setDrafts] = useState<Record<number, DayScheduleRow[]>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const members = useMemo(
    () => [...team].sort((a, b) => a.id - b.id),
    [team]
  );

  useEffect(() => {
    const next: Record<number, DayScheduleRow[]> = {};
    for (const m of members) {
      next[m.id] = parseWorkingHoursFromApi(
        (m.worker_profile?.working_hours ?? {}) as Record<string, unknown>
      );
    }
    setDrafts(next);
  }, [members]);

  const updateDraft = useCallback(
    (memberId: number, rows: DayScheduleRow[]) => {
      setDrafts((prev) => ({ ...prev, [memberId]: rows }));
    },
    []
  );

  async function saveMember(m: OrgTeamMember) {
    const rows = drafts[m.id];
    if (!rows) {
      return;
    }
    setError(null);
    setSavingId(m.id);
    try {
      const profile = m.worker_profile ?? { service_ids: [], working_hours: {} };
      await patchTeamMember(m.id, {
        worker_profile: {
          service_ids: Array.isArray(profile.service_ids)
            ? profile.service_ids
            : [],
          working_hours: workingHoursToPayload(rows),
        },
      });
      await onTeamChanged();
    } catch (e) {
      setError(getApiErrorMessage(e, "Raspored nije sačuvan."));
    } finally {
      setSavingId(null);
    }
  }

  if (teamLoading) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Učitavanje tima…
      </p>
    );
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Nema članova tima. Dodaj zaposlene u kartici „Tim“.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Raspored zaposlenih
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Postavi radno vreme po danima za svakog člana. Koristi se u kalendaru
          pri izboru radnika za termin (samo oni koji rade tog dana).
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {!isAdmin ? (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Samo administrator može menjati raspored.
        </p>
      ) : null}

      <div className="space-y-6">
        {members.map((m, idx) => {
          const rows = drafts[m.id] ?? parseWorkingHoursFromApi({});
          const borderAccent = ACCENT_BORDER[idx % ACCENT_BORDER.length]!;
          const label = m.display_name?.trim() || m.email;
          const busy = savingId === m.id;

          return (
            <SurfaceCard
              key={m.id}
              padding="md"
              className={cn(
                "border-l-4 transition-all duration-200 hover:shadow-md",
                borderAccent
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                    {label}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {m.email}
                    {m.role === "admin" ? " · Administrator" : " · Radnik"}
                  </p>
                </div>
                {isAdmin ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={busy}
                      onClick={() =>
                        updateDraft(m.id, copyMondayToWeek(rows))
                      }
                    >
                      <Copy className="mr-1.5 size-4" aria-hidden />
                      Kopiraj pon na sve dane
                    </Button>
                    <Button
                      type="button"
                      variant="brand"
                      size="sm"
                      className="rounded-xl"
                      disabled={busy}
                      onClick={() => void saveMember(m)}
                    >
                      <Save className="mr-1.5 size-4" aria-hidden />
                      {busy ? "Čuvam…" : "Sačuvaj raspored"}
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                {DAY_DEFINITIONS.map(({ id, label: dayLabel }) => {
                  const row = rows.find((r) => r.id === id)!;
                  const short = dayLabel.slice(0, 3);
                  const disabled = !isAdmin || busy;
                  return (
                    <div
                      key={id}
                      className={cn(
                        "space-y-2 rounded-xl border p-3",
                        row.enabled
                          ? "border-slate-200 bg-slate-50/90 dark:border-slate-600 dark:bg-slate-800/40"
                          : "border-dashed border-slate-200 bg-slate-50/40 opacity-90 dark:border-slate-600 dark:bg-slate-900/30"
                      )}
                    >
                      <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          disabled={disabled}
                          onChange={(e) =>
                            updateDraft(
                              m.id,
                              patchDay(rows, id, { enabled: e.target.checked })
                            )
                          }
                          className="rounded border-slate-300"
                        />
                        {short}
                      </label>
                      {row.enabled ? (
                        <>
                          <div>
                            <span className="mb-0.5 block text-[10px] uppercase tracking-wide text-slate-500">
                              Od
                            </span>
                            <input
                              type="time"
                              disabled={disabled}
                              value={row.open}
                              onChange={(e) =>
                                updateDraft(
                                  m.id,
                                  patchDay(rows, id, { open: e.target.value })
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <span className="mb-0.5 block text-[10px] uppercase tracking-wide text-slate-500">
                              Do
                            </span>
                            <input
                              type="time"
                              disabled={disabled}
                              value={row.close}
                              onChange={(e) =>
                                updateDraft(
                                  m.id,
                                  patchDay(rows, id, {
                                    close: e.target.value,
                                  })
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </>
                      ) : (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Neradni dan
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Ovo je nedeljni raspored radnika (ko radi koji dan). Konkretne
                dnevne smene za kalendar i rezervacije čuvaju se na stranici{" "}
                <strong className="font-medium text-slate-600 dark:text-slate-300">
                  Smena
                </strong>{" "}
                — tamo klikni „Sačuvaj smene“ (možeš početi od predloga iz ovog
                rasporeda).
              </p>
            </SurfaceCard>
          );
        })}
      </div>
    </div>
  );
}
