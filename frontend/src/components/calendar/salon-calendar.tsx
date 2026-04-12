"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  deleteAppointment,
  getAppointments,
  getOrgTeam,
  patchAppointment,
} from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { canDeleteRecords } from "@/lib/permissions";
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";
import {
  addDays,
  formatYyyyMmDd,
  parseYyyyMmDd,
  startOfWeekMonday,
  todayLocal,
} from "@/lib/dateLocal";
import type { AppointmentRow, AppointmentStatus } from "@/types/appointment";
import AddAppointmentModal from "./AddAppointmentModal";
import AppointmentCard from "./AppointmentCard";
import CalendarFiltersSidebar, {
  type CalendarStatusFilter,
} from "./CalendarFiltersSidebar";
import CalendarHeader from "./CalendarHeader";
import { CalendarLegend } from "./calendar-legend";
import { CalendarLoadingSkeleton } from "./calendar-loading-skeleton";
import {
  browserTimeZone,
  formatYmdLongInZone,
  hasOverlapWithOthers,
  ymdInTimeZone,
} from "./calendar-utils";
import type { OrgTeamMember } from "@/types/user";
import useCalendarStore from "./useCalendarStore";
import WeekTimeGrid from "./WeekTimeGrid";
import {
  useAppointmentsSse,
  type AppointmentSseMessage,
} from "@/hooks/useAppointmentsSse";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  orgHasWorkingHoursSchedule,
  weekTimeGridHours,
} from "@/lib/calendar-grid-bounds";
import { toast } from "sonner";

function sortApptsByDate(rows: AppointmentRow[]): AppointmentRow[] {
  return [...rows].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

function isAppointmentInVisibleRange(
  row: AppointmentRow,
  view: "day" | "week",
  selectedDay: string,
  tz: string
): boolean {
  const ymd = ymdInTimeZone(row.date, tz);
  if (view === "day") {
    return ymd === selectedDay;
  }
  const ws = startOfWeekMonday(parseYyyyMmDd(selectedDay));
  const from = formatYyyyMmDd(ws);
  const to = formatYyyyMmDd(addDays(ws, 6));
  return ymd >= from && ymd <= to;
}

function applyCalendarFilters(
  rows: AppointmentRow[],
  statusFilter: CalendarStatusFilter,
  search: string
): AppointmentRow[] {
  const q = search.trim().toLowerCase();
  return rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) {
      return false;
    }
    if (!q) {
      return true;
    }
    const client = (r.client_name ?? "").toLowerCase();
    const service = (r.service_name ?? "").toLowerCase();
    const staff = `${r.staff_display_name ?? ""} ${r.staff_email ?? ""}`
      .trim()
      .toLowerCase();
    return client.includes(q) || service.includes(q) || staff.includes(q);
  });
}

export function SalonCalendar() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { settings } = useOrganization();
  const allowDelete = canDeleteRecords(user, settings);

  const [view, setView] = useState<"day" | "week">("week");
  const [selectedDay, setSelectedDay] = useState(() =>
    formatYyyyMmDd(todayLocal())
  );
  const [highlightApptId, setHighlightApptId] = useState<number | null>(null);
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] =
    useState<CalendarStatusFilter>("all");
  const [searchDraft, setSearchDraft] = useState("");
  const debouncedSearch = useDebouncedValue(searchDraft, 320);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [teamOptions, setTeamOptions] = useState<
    { id: number; label: string }[]
  >([]);

  const { appointments, setAppointments, moveAppointment } =
    useCalendarStore([]);

  const tz = useMemo(
    () => settings?.timezone?.trim() || browserTimeZone(),
    [settings?.timezone]
  );

  const urlDay = searchParams.get("day");
  const urlView = searchParams.get("view");
  const urlAppt = searchParams.get("appt");

  const didBootstrapOrgTodayRef = useRef(false);

  useEffect(() => {
    if (urlDay && /^\d{4}-\d{2}-\d{2}$/.test(urlDay)) {
      setSelectedDay(urlDay);
    }
    if (urlView === "day" || urlView === "week") {
      setView(urlView);
    }
    if (urlAppt && /^\d+$/.test(urlAppt)) {
      setHighlightApptId(Number.parseInt(urlAppt, 10));
    } else {
      setHighlightApptId(null);
    }
  }, [urlDay, urlView, urlAppt]);

  /** Kad stigne zona salona: „danas“ u zoni, osim ako URL već bira dan ili korisnik je već menjao datum. */
  useEffect(() => {
    const z = settings?.timezone?.trim();
    if (!z || didBootstrapOrgTodayRef.current) {
      return;
    }
    if (urlDay && /^\d{4}-\d{2}-\d{2}$/.test(urlDay)) {
      didBootstrapOrgTodayRef.current = true;
      return;
    }
    const browserYmd = formatYyyyMmDd(todayLocal());
    setSelectedDay((prev) => {
      if (prev !== browserYmd) {
        return prev;
      }
      return ymdInTimeZone(new Date().toISOString(), z);
    });
    didBootstrapOrgTodayRef.current = true;
  }, [settings?.timezone, urlDay]);

  const loadAppointments = useCallback(
    async (options?: { soft?: boolean }) => {
      const soft = options?.soft === true;
      if (!soft) {
        setLoading(true);
      }
      setListError(null);
      try {
        if (view === "week") {
          const ws = startOfWeekMonday(parseYyyyMmDd(selectedDay));
          const from = formatYyyyMmDd(ws);
          const to = formatYyyyMmDd(addDays(ws, 6));
          const { data } = await getAppointments({ from, to, timezone: tz });
          const list = Array.isArray(data) ? data : [];
          setRows(list);
          setAppointments(list);
        } else {
          const { data } = await getAppointments({
            day: selectedDay,
            timezone: tz,
          });
          const list = Array.isArray(data) ? data : [];
          setRows(list);
          setAppointments(list);
        }
      } catch (e) {
        setListError(getApiErrorMessage(e, "Termini nisu učitani."));
        setRows([]);
        setAppointments([]);
      } finally {
        if (!soft) {
          setLoading(false);
        }
      }
    },
    [view, selectedDay, tz, setAppointments]
  );

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const handleAppointmentSse = useCallback(
    (msg: AppointmentSseMessage) => {
      if (msg.type !== "appointments") {
        void loadAppointments({ soft: true });
        return;
      }
      if (msg.event === "SYNC") {
        void loadAppointments({ soft: true });
        return;
      }

      const ev = msg.event;

      if (ev === "DELETE_APPOINTMENT") {
        const raw = msg.payload;
        const id =
          raw &&
          typeof raw === "object" &&
          "id" in raw &&
          typeof (raw as { id: unknown }).id === "number"
            ? (raw as { id: number }).id
            : null;
        if (id != null) {
          setRows((p) => p.filter((a) => a.id !== id));
          setAppointments((p) => p.filter((a) => a.id !== id));
        }
        return;
      }

      if (ev !== "NEW_APPOINTMENT" && ev !== "UPDATE_APPOINTMENT") {
        void loadAppointments({ soft: true });
        return;
      }

      const raw = msg.payload;
      if (
        !raw ||
        typeof raw !== "object" ||
        !("id" in raw) ||
        typeof (raw as { id: unknown }).id !== "number"
      ) {
        void loadAppointments({ soft: true });
        return;
      }
      const appt = raw as AppointmentRow;
      const inView = isAppointmentInVisibleRange(appt, view, selectedDay, tz);

      if (ev === "UPDATE_APPOINTMENT") {
        setRows((prev) => {
          const rest = prev.filter((a) => a.id !== appt.id);
          if (!inView) {
            return rest;
          }
          return sortApptsByDate([...rest, appt]);
        });
        setAppointments((prev) => {
          const rest = prev.filter((a) => a.id !== appt.id);
          if (!inView) {
            return rest;
          }
          return sortApptsByDate([...rest, appt]);
        });
        return;
      }

      // NEW_APPOINTMENT
      if (!inView) {
        return;
      }
      setRows((prev) => {
        if (prev.some((a) => a.id === appt.id)) {
          return sortApptsByDate(
            prev.map((a) => (a.id === appt.id ? appt : a))
          );
        }
        return sortApptsByDate([...prev, appt]);
      });
      setAppointments((prev) => {
        if (prev.some((a) => a.id === appt.id)) {
          return sortApptsByDate(
            prev.map((a) => (a.id === appt.id ? appt : a))
          );
        }
        return sortApptsByDate([...prev, appt]);
      });
    },
    [loadAppointments, view, selectedDay, tz, setAppointments]
  );

  useAppointmentsSse(!!user, handleAppointmentSse);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setTeamOptions([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await getOrgTeam();
        const rows = Array.isArray(data) ? data : [];
        const normalized: OrgTeamMember[] = rows.map((m) => ({
          ...m,
          display_name: m.display_name ?? null,
          worker_profile:
            m.worker_profile &&
            typeof m.worker_profile === "object" &&
            "service_ids" in m.worker_profile
              ? {
                  service_ids: Array.isArray(m.worker_profile.service_ids)
                    ? m.worker_profile.service_ids
                    : [],
                  working_hours:
                    typeof m.worker_profile.working_hours === "object"
                      ? m.worker_profile.working_hours
                      : {},
                }
              : { service_ids: [], working_hours: {} },
        }));
        if (!cancelled) {
          setTeamOptions(
            normalized.map((m) => ({
              id: m.id,
              label: (m.display_name?.trim() || m.email) as string,
            }))
          );
        }
      } catch {
        if (!cancelled) {
          setTeamOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filteredAppointments = useMemo(
    () => applyCalendarFilters(appointments, statusFilter, debouncedSearch),
    [appointments, statusFilter, debouncedSearch]
  );

  const weekDays = useMemo(() => {
    const weekStart = startOfWeekMonday(parseYyyyMmDd(selectedDay));
    return Array.from({ length: 7 }, (_, i) =>
      formatYyyyMmDd(addDays(weekStart, i))
    );
  }, [selectedDay]);

  const weekGridHours = useMemo(
    () =>
      weekTimeGridHours({
        weekDaysYmd: weekDays,
        timeZone: tz,
        workingHours: settings?.working_hours as
          | Record<string, unknown>
          | undefined,
        appointments: rows,
      }),
    [weekDays, tz, settings?.working_hours, rows]
  );

  function goToday() {
    const z = settings?.timezone?.trim();
    if (z) {
      setSelectedDay(ymdInTimeZone(new Date().toISOString(), z));
      return;
    }
    setSelectedDay(formatYyyyMmDd(todayLocal()));
  }

  function shiftDay(delta: number) {
    setSelectedDay(formatYyyyMmDd(addDays(parseYyyyMmDd(selectedDay), delta)));
  }

  function shiftWeek(delta: number) {
    setSelectedDay(
      formatYyyyMmDd(addDays(parseYyyyMmDd(selectedDay), delta * 7))
    );
  }

  async function patchStatus(id: number, status: AppointmentStatus) {
    try {
      await patchAppointment(id, { status });
      await loadAppointments();
      toast.success("Status ažuriran");
    } catch (e) {
      setListError(getApiErrorMessage(e, "Status nije sačuvan."));
    }
  }

  async function patchStaffAssignment(id: number, staffUserId: number | null) {
    setListError(null);
    try {
      await patchAppointment(id, { staff_user_id: staffUserId });
      await loadAppointments();
      toast.success("Radnik ažuriran");
    } catch (e) {
      setListError(getApiErrorMessage(e, "Dodela radnika nije sačuvana."));
    }
  }

  async function handleDeleteAppointment(id: number) {
    setListError(null);
    try {
      await deleteAppointment(id);
      await loadAppointments();
      toast.success("Termin obrisan");
    } catch (e) {
      setListError(getApiErrorMessage(e, "Termin nije obrisan."));
    }
  }

  const handleReschedule = useCallback(
    async (id: number, newDateIso: string) => {
      setListError(null);
      const targetYmd = ymdInTimeZone(newDateIso, tz);
      const row = appointments.find((a) => a.id === id);
      const durationMin = row?.service_duration ?? 30;
      if (
        hasOverlapWithOthers(
          id,
          newDateIso,
          durationMin,
          appointments,
          tz,
          targetYmd,
          row?.staff_user_id ?? null
        )
      ) {
        setListError(
          "Preklapanje za istog radnika: u tom intervalu već postoji termin (posle zaokruživanja na 15 min)."
        );
        return;
      }
      moveAppointment(id, newDateIso);
      try {
        await patchAppointment(id, { date: newDateIso });
        await loadAppointments();
        toast.success("Termin pomeren");
      } catch (e) {
        setListError(
          getApiErrorMessage(e, "Pomeranje termina nije sačuvano.")
        );
        await loadAppointments();
      }
    },
    [appointments, moveAppointment, loadAppointments, tz]
  );

  const dayListSorted = useMemo(() => {
    return [...filteredAppointments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredAppointments]);

  useEffect(() => {
    if (highlightApptId == null || view !== "day" || loading) {
      return;
    }
    const t = window.setTimeout(() => {
      const el = document.getElementById(`cal-appt-${highlightApptId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    return () => window.clearTimeout(t);
  }, [highlightApptId, view, loading, dayListSorted]);

  return (
    <div className="space-y-6">
      <CalendarHeader
        view={view}
        onViewChange={setView}
        timeZone={tz}
        onToday={goToday}
        onPrev={() => (view === "week" ? shiftWeek(-1) : shiftDay(-1))}
        onNext={() => (view === "week" ? shiftWeek(1) : shiftDay(1))}
        onAddClick={() => setDialogOpen(true)}
      />

      {view === "week" ? (
        <CalendarLegend
          showClosedHoursBand={orgHasWorkingHoursSchedule(
            settings?.working_hours as Record<string, unknown> | undefined
          )}
        />
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <CalendarFiltersSidebar
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          search={searchDraft}
          onSearchChange={setSearchDraft}
        />

        <div className="min-w-0 flex-1 space-y-4">
          {view === "day" ? (
            <div className="rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm text-sky-900 shadow-sm">
              Datum:{" "}
              <span className="font-medium">
                {formatYmdLongInZone(selectedDay, tz)}
              </span>
            </div>
          ) : null}

          {listError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {listError}
            </div>
          ) : null}

          {loading ? (
            <CalendarLoadingSkeleton view={view} />
          ) : view === "week" ? (
            rows.length === 0 ? (
              <p className="rounded-xl border border-sky-100 bg-white py-16 text-center text-sm text-sky-700/80 shadow-sm">
                Nema termina ove nedelje. Dodaj termin ili promeni nedelju.
              </p>
            ) : filteredAppointments.length === 0 ? (
              <p className="rounded-xl border border-amber-100 bg-amber-50/80 py-12 text-center text-sm text-amber-900 shadow-sm">
                Nema termina koji odgovaraju filterima. Isprazni pretragu ili
                izaberi „Svi statusi“.
              </p>
            ) : (
              <WeekTimeGrid
                weekDays={weekDays}
                rows={filteredAppointments}
                timeZone={tz}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                onPatchStatus={patchStatus}
                onReschedule={handleReschedule}
                allowDelete={allowDelete}
                onDelete={handleDeleteAppointment}
                canAssignStaff={user?.role === "admin"}
                teamOptions={teamOptions}
                onPatchStaff={patchStaffAssignment}
                gridStartHour={weekGridHours.gridStartHour}
                gridEndHour={weekGridHours.gridEndHour}
                orgWorkingHours={
                  settings?.working_hours as Record<string, unknown> | undefined
                }
              />
            )
          ) : dayListSorted.length === 0 ? (
            <div className="rounded-xl border border-sky-100 bg-white py-16 text-center shadow-sm">
              <p className="text-sm text-sky-700/80">
                {rows.length === 0
                  ? "Za ovaj izabrani dan nema zakazanih termina u bazi. Proveri datum strelicama ili „Danas“, pređi na prikaz „Nedelja“ da vidiš ostale dane, ili dodaj termin."
                  : "Za ovaj dan postoje termini, ali nijedan ne prolazi filter (npr. samo „Zakazano“ ili pretraga). Izaberi „Svi statusi“ i isprazni pretragu da vidiš sve."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayListSorted.map((row) => {
                const timeLabel = new Date(row.date).toLocaleTimeString(
                  "sr-Latn-RS",
                  { hour: "2-digit", minute: "2-digit", timeZone: tz }
                );
                return (
                  <AppointmentCard
                    key={row.id}
                    appointment={row}
                    timeLabel={timeLabel}
                    onPatchStatus={patchStatus}
                    allowDelete={allowDelete}
                    onDelete={handleDeleteAppointment}
                    highlight={highlightApptId === row.id}
                    canAssignStaff={user?.role === "admin"}
                    teamOptions={teamOptions}
                    onPatchStaff={patchStaffAssignment}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddAppointmentModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultStartLocal={`${selectedDay}T09:00`}
        onCreated={loadAppointments}
      />
    </div>
  );
}
