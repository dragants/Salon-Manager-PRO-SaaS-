"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardCopy, Save } from "lucide-react";
import ShiftPlanner from "@/components/shifts/ShiftPlanner";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  getOrgTeam,
  getWorkShifts,
  replaceWorkShifts,
} from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatYyyyMmDd, todayLocal } from "@/lib/dateLocal";
import {
  decimalHourToHHMM,
  shiftsToApiPayload,
  workShiftToPlanner,
} from "@/lib/shift-planner";
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";
import type { OrgTeamMember } from "@/types/user";
import type { ShiftPlannerShift } from "@/types/shift";
import { toast } from "sonner";
import { SHIFT_PLANNER_END_HOUR } from "@/components/calendar/calendar-constants";

function teamToEmployees(team: OrgTeamMember[]) {
  return team.map((m) => ({
    id: m.id,
    name: (m.display_name?.trim() || m.email) as string,
  }));
}

export default function ShiftsPage() {
  const { user, loading: authLoading } = useAuth();
  const { settings } = useOrganization();
  const orgTz = settings?.timezone?.trim();
  const [team, setTeam] = useState<OrgTeamMember[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [saving, setSaving] = useState(false);

  const [date, setDate] = useState(() => formatYyyyMmDd(todayLocal()));
  const [shifts, setShifts] = useState<ShiftPlannerShift[]>([]);

  useEffect(() => {
    if (authLoading || user?.role === "worker") {
      setLoadingTeam(false);
      return;
    }
    let c = false;
    setLoadingTeam(true);
    getOrgTeam()
      .then((res) => {
        if (!c) {
          setTeam(Array.isArray(res.data) ? res.data : []);
          setLoadError(null);
        }
      })
      .catch((e) => {
        if (!c) {
          setLoadError(getApiErrorMessage(e, "Tim nije učitan."));
          setTeam([]);
        }
      })
      .finally(() => {
        if (!c) setLoadingTeam(false);
      });
    return () => {
      c = true;
    };
  }, [authLoading, user?.role]);

  useEffect(() => {
    if (authLoading || user?.role === "worker") {
      return;
    }
    let c = false;
    setLoadingShifts(true);
    getWorkShifts(date, orgTz)
      .then((res) => {
        if (!c) {
          const rows = Array.isArray(res.data?.shifts) ? res.data.shifts : [];
          setShifts(rows.map((r) => workShiftToPlanner(r, date)));
          setLoadError(null);
        }
      })
      .catch((e) => {
        if (!c) {
          const msg = getApiErrorMessage(e, "Smene nisu učitane.");
          setShifts([]);
          if (
            typeof msg === "string" &&
            (msg.toLowerCase().includes("work_shifts") ||
              msg.includes("42P01"))
          ) {
            setLoadError(
              `${msg} Pokreni migraciju backend/sql/migrations/011_work_shifts.sql.`
            );
          } else {
            setLoadError(msg);
          }
        }
      })
      .finally(() => {
        if (!c) setLoadingShifts(false);
      });
    return () => {
      c = true;
    };
  }, [authLoading, user?.role, date, orgTz]);

  const employees = useMemo(() => teamToEmployees(team), [team]);

  const onShiftsChange = useCallback((next: ShiftPlannerShift[]) => {
    setShifts(next);
  }, []);

  const apiPreview = useMemo(
    () => shiftsToApiPayload(shifts.filter((s) => s.date === date)),
    [date, shifts]
  );

  const copyPayload = useCallback(() => {
    void navigator.clipboard.writeText(JSON.stringify(apiPreview, null, 2));
    toast.success("JSON kopiran");
  }, [apiPreview]);

  const saveToServer = useCallback(async () => {
    setSaving(true);
    try {
      const body = {
        shifts: shifts
          .filter((s) => s.date === date)
          .map((s) => ({
            user_id: s.employee_id,
            start: decimalHourToHHMM(s.startHour),
            end: decimalHourToHHMM(s.startHour + s.durationHours),
          })),
      };
      const { data } = await replaceWorkShifts(date, body, orgTz);
      const rows = Array.isArray(data?.shifts) ? data.shifts : [];
      setShifts(rows.map((r) => workShiftToPlanner(r, date)));
      toast.success("Smene sačuvane — kalendar sada može koristiti dostupnost.");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Čuvanje smena nije uspelo."));
    } finally {
      setSaving(false);
    }
  }, [date, orgTz, shifts]);

  if (authLoading) {
    return (
      <p className="text-sm text-sky-700/80">Učitavanje…</p>
    );
  }

  if (user?.role === "worker") {
    return (
      <SurfaceCard className="p-6">
        <p className="text-sm text-sky-800">
          Raspored smena mogu da uređuju samo administratori. Obrati se
          vlasniku naloga.
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Raspored smena"
        description="Smene se čuvaju u bazi i koriste za automatske slobodne termine u modalu „Novi termin“. Sačuvaj posle izmena."
      />

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm text-sky-800">
          <span className="font-medium text-sky-900">Datum</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sky-950 shadow-sm"
          />
        </label>
        {orgTz ? (
          <p className="text-xs text-sky-600">
            Vremenska zona salona: {orgTz}
          </p>
        ) : null}
        <Button
          type="button"
          className="gap-2 bg-sky-600 hover:bg-sky-700"
          onClick={() => void saveToServer()}
          disabled={saving || loadingShifts}
        >
          <Save className="size-4" aria-hidden />
          {saving ? "Čuvam…" : "Sačuvaj smene"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 border-sky-200"
          onClick={copyPayload}
          disabled={apiPreview.length === 0}
        >
          <ClipboardCopy className="size-4" aria-hidden />
          Kopiraj JSON
        </Button>
      </div>

      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </p>
      ) : null}

      {loadingTeam ? (
        <p className="text-sm text-sky-700/80">Učitavanje tima…</p>
      ) : (
        <ShiftPlanner
          date={date}
          employees={employees}
          shifts={shifts}
          onShiftsChange={onShiftsChange}
          hourStart={8}
          hourEnd={SHIFT_PLANNER_END_HOUR}
        />
      )}
    </div>
  );
}
