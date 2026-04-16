"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createAppointment,
  getAvailability,
  getLoyaltyEligibility,
  getOrgTeam,
} from "@/lib/api";
import { api } from "@/lib/api/client";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api/errors";
import { computeSuggestedSlots } from "@/lib/admin-slot-suggestions";
import { useAppointmentsSse } from "@/hooks/useAppointmentsSse";
import {
  browserTimeZone,
  ymdInTimeZone,
} from "@/components/features/calendar/calendar-utils";
import { workerAllowsAppointmentWindow } from "@/lib/worker-schedule";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/providers/organization-provider";
import type { AppointmentRow } from "@/types/appointment";
import type { LoyaltyEligibilityRow } from "@/types/loyalty";
import type { AvailabilitySlotDto } from "@/types/shift";
import type { OrgTeamMember } from "@/types/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClientOpt = { id: number; name: string; email?: string | null };
type ServiceOpt = {
  id: number;
  name: string;
  duration: number;
  buffer_minutes?: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStartLocal: string;
  onCreated: () => void | Promise<void>;
};

function isoToDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AddAppointmentModal({
  open,
  onOpenChange,
  defaultStartLocal,
  onCreated,
}: Props) {
  const router = useRouter();
  const { settings } = useOrganization();
  const [clients, setClients] = useState<ClientOpt[]>([]);
  const [services, setServices] = useState<ServiceOpt[]>([]);
  const [formClient, setFormClient] = useState("");
  const [formService, setFormService] = useState("");
  const [formStaff, setFormStaff] = useState("");
  const [team, setTeam] = useState<OrgTeamMember[]>([]);
  const [formStart, setFormStart] = useState("");
  const [formSms, setFormSms] = useState(false);
  const [formWa, setFormWa] = useState(false);
  const [formEmail, setFormEmail] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dayAppointments, setDayAppointments] = useState<AppointmentRow[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<
    AvailabilitySlotDto[]
  >([]);
  const [availabilityFromShifts, setAvailabilityFromShifts] = useState(false);
  const [sseTick, setSseTick] = useState(0);
  const [loyaltyRows, setLoyaltyRows] = useState<LoyaltyEligibilityRow[]>([]);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [redeemLoyalty, setRedeemLoyalty] = useState(false);

  const orgTz = settings?.timezone?.trim() || browserTimeZone();

  useAppointmentsSse(
    open,
    useCallback(() => {
      setSseTick((t) => t + 1);
    }, [])
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [c, s, t] = await Promise.all([
          api.get<ClientOpt[]>("/clients"),
          api.get<ServiceOpt[]>("/services"),
          getOrgTeam(),
        ]);
        if (cancelled) {
          return;
        }
        setClients(Array.isArray(c.data) ? c.data : []);
        setServices(Array.isArray(s.data) ? s.data : []);
        const raw = Array.isArray(t.data) ? t.data : [];
        setTeam(
          raw.map((m) => ({
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
          }))
        );
      } catch {
        if (!cancelled) {
          setFormError("Klijenti ili usluge nisu učitani.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setFormStart(defaultStartLocal);
      setFormClient("");
      setFormService("");
      setFormStaff("");
      setFormSms(false);
      setFormWa(false);
      setFormEmail(false);
      setFormError(null);
      setDayAppointments([]);
      setAvailabilitySlots([]);
      setAvailabilityFromShifts(false);
      setLoyaltyRows([]);
      setLoyaltyLoading(false);
      setRedeemLoyalty(false);
    }
  }, [open, defaultStartLocal]);

  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === formService),
    [formService, services]
  );

  const dayYmd = useMemo(() => {
    if (!formStart) {
      return null;
    }
    const d = new Date(formStart);
    if (Number.isNaN(d.getTime())) {
      return null;
    }
    return ymdInTimeZone(d.toISOString(), orgTz);
  }, [formStart, orgTz]);

  useEffect(() => {
    if (!open || !dayYmd) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await api.get<AppointmentRow[]>("/appointments", {
          params: { day: dayYmd, timezone: orgTz },
        });
        if (!cancelled) {
          setDayAppointments(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setDayAppointments([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, dayYmd, orgTz, sseTick]);

  useEffect(() => {
    if (!open || !dayYmd || !selectedService) {
      setAvailabilitySlots([]);
      setAvailabilityFromShifts(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await getAvailability({
          day: dayYmd,
          service_id: selectedService.id,
          ...(formStaff ? { staff_user_id: Number(formStaff) } : {}),
        });
        if (!cancelled) {
          setAvailabilitySlots(Array.isArray(data?.slots) ? data.slots : []);
          setAvailabilityFromShifts(Boolean(data?.from_shifts));
        }
      } catch {
        if (!cancelled) {
          setAvailabilitySlots([]);
          setAvailabilityFromShifts(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, dayYmd, selectedService?.id, formStaff, sseTick]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const cid = formClient ? Number(formClient) : NaN;
    const sid = formService ? Number(formService) : NaN;
    if (!Number.isFinite(cid) || !Number.isFinite(sid)) {
      setLoyaltyRows([]);
      setLoyaltyLoading(false);
      setRedeemLoyalty(false);
      return;
    }
    let cancelled = false;
    setRedeemLoyalty(false);
    setLoyaltyLoading(true);
    void (async () => {
      try {
        const { data } = await getLoyaltyEligibility({
          client_id: cid,
          service_id: sid,
        });
        if (!cancelled) {
          setLoyaltyRows(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setLoyaltyRows([]);
        }
      } finally {
        if (!cancelled) {
          setLoyaltyLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, formClient, formService]);

  const loyaltyProgram = loyaltyRows[0] ?? null;

  useEffect(() => {
    if (!loyaltyProgram || loyaltyProgram.rewards_available < 1) {
      setRedeemLoyalty(false);
    }
  }, [loyaltyProgram]);

  const selectedClient = useMemo(() => {
    if (!formClient) return null;
    const id = Number(formClient);
    return clients.find((c) => c.id === id) ?? null;
  }, [clients, formClient]);

  const selectedStaffMember = useMemo(() => {
    if (!formStaff) return null;
    const id = Number(formStaff);
    return team.find((m) => m.id === id) ?? null;
  }, [formStaff, team]);

  const eligibleTeam = useMemo(() => {
    const sid = formService ? Number(formService) : NaN;
    const start = formStart ? new Date(formStart) : null;
    const dur = selectedService?.duration ?? 60;
    const byService = (m: (typeof team)[0]) => {
      if (!Number.isFinite(sid)) {
        return true;
      }
      const ids = m.worker_profile?.service_ids;
      if (!Array.isArray(ids) || ids.length === 0) {
        return true;
      }
      return ids.includes(sid);
    };
    const bySchedule = (m: (typeof team)[0]) => {
      if (!start || Number.isNaN(start.getTime())) {
        return true;
      }
      const iso = start.toISOString();
      return workerAllowsAppointmentWindow(m, iso, orgTz, dur);
    };
    return team.filter((m) => byService(m) && bySchedule(m));
  }, [team, formService, formStart, selectedService, orgTz]);

  const suggestedSlots = useMemo(() => {
    if (!settings || !dayYmd || !selectedService) {
      return [];
    }
    return computeSuggestedSlots({
      ymd: dayYmd,
      timeZone: orgTz,
      orgWorkingHours: settings.working_hours as Record<string, unknown>,
      worker: selectedStaffMember,
      staffUserId: formStaff ? Number(formStaff) : null,
      calendarRules: settings.calendar_rules,
      serviceDuration: selectedService.duration,
      serviceBufferMinutes: selectedService.buffer_minutes ?? 0,
      appointments: dayAppointments,
    });
  }, [
    settings,
    dayYmd,
    selectedService,
    orgTz,
    selectedStaffMember,
    formStaff,
    dayAppointments,
  ]);

  type SlotChip = {
    key: string;
    startIso: string;
    label: string;
    soon?: boolean;
    employeeId?: number;
    source: "shifts" | "rules";
  };

  const slotChips = useMemo((): SlotChip[] => {
    if (availabilityFromShifts) {
      return availabilitySlots.map((s) => ({
        key: `av-${s.start_iso}-${s.employee_id}`,
        startIso: s.start_iso,
        label: `${s.start} · ${s.employee_name}`,
        soon: s.soon,
        employeeId: s.employee_id,
        source: "shifts" as const,
      }));
    }
    return suggestedSlots.map((s) => ({
      key: `ru-${s.startIso}`,
      startIso: s.startIso,
      label: s.label,
      source: "rules" as const,
    }));
  }, [availabilityFromShifts, availabilitySlots, suggestedSlots]);

  const busyChips = useMemo(() => {
    return dayAppointments
      .filter((a) => a.status === "scheduled")
      .filter((a) => {
        if (!formStaff) return true;
        return String(a.staff_user_id ?? "") === formStaff;
      })
      .map((a) => {
        const t = new Date(a.date).toLocaleTimeString("sr-Latn-RS", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: orgTz,
        });
        const staff = team.find((m) => m.id === a.staff_user_id);
        const sn = staff
          ? staff.display_name?.trim() || staff.email
          : a.staff_user_id
            ? `#${a.staff_user_id}`
            : "Bez radnika";
        return { key: `busy-${a.id}`, label: `${t} · ${sn}` };
      });
  }, [dayAppointments, formStaff, orgTz, team]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!formClient || !formService || !formStart) {
      setFormError("Popuni sva polja.");
      return;
    }
    if (formEmail) {
      const em = selectedClient?.email?.trim();
      if (!em) {
        setFormError(
          "Za e-mail obaveštenje klijent mora imati adresu na kartici (Klijenti), ili isključi „Pošalji e-mail“."
        );
        return;
      }
    }
    const start = new Date(formStart);
    if (Number.isNaN(start.getTime())) {
      setFormError("Neispravno vreme.");
      return;
    }
    const iso = start.toISOString();
    const dur = selectedService?.duration ?? 60;
    if (formStaff) {
      const sm = team.find((m) => m.id === Number(formStaff));
      if (
        sm &&
        !workerAllowsAppointmentWindow(sm, iso, orgTz, dur)
      ) {
        setFormError(
          "Izabrani radnik nema smenu u tom intervalu — izaberi drugo vreme ili drugog radnika."
        );
        return;
      }
    }
    setSaving(true);
    try {
      const lp = loyaltyProgram;
      const useRedeem = Boolean(
        lp && redeemLoyalty && lp.rewards_available > 0
      );
      await createAppointment({
        client_id: Number(formClient),
        service_id: Number(formService),
        date: iso,
        staff_user_id: formStaff ? Number(formStaff) : null,
        redeems_loyalty: useRedeem,
        loyalty_program_id: useRedeem && lp ? lp.program_id : null,
        send_sms: formSms,
        send_whatsapp: formWa,
        send_email: formEmail,
      });
      onOpenChange(false);
      await onCreated();
      toast.success("Termin dodat");
    } catch (err) {
      if (getApiErrorCode(err) === "PLAN_APPOINTMENT_MONTH_LIMIT") {
        setFormError(null);
        toast.error(
          getApiErrorMessage(err, "Dostignut je mesečni limit termina."),
          {
            action: {
              label: "Pretplata",
              onClick: () => router.push("/subscribe"),
            },
          }
        );
      } else {
        setFormError(getApiErrorMessage(err, "Termin nije kreiran."));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-sky-100 sm:max-w-md lg:max-w-lg"
        showCloseButton
      >
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Novi termin</DialogTitle>
            <DialogDescription>
              Klijent, usluga, vreme. Ako postoje smene u{" "}
              <strong>Smena</strong>, predlozi prate smene i zauzeće; inače
              koriste se radno vreme salona i pravila kalendara.
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[min(70vh,640px)] gap-4 overflow-y-auto py-2 pr-1">
            {formError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
                {formError}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="cal-client">Klijent</Label>
              <select
                id="cal-client"
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                value={formClient}
                onChange={(e) => setFormClient(e.target.value)}
                required
              >
                <option value="">Izaberi…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.email?.trim() ? ` · ${c.email.trim()}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal-service">Usluga</Label>
              <select
                id="cal-service"
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                value={formService}
                onChange={(e) => {
                  setFormService(e.target.value);
                  setFormStaff("");
                }}
                required
              >
                <option value="">Izaberi…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration} min)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal-staff">Radnik (opciono)</Label>
              <select
                id="cal-staff"
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                value={formStaff}
                onChange={(e) => setFormStaff(e.target.value)}
              >
                <option value="">Bez dodele</option>
                {eligibleTeam.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name?.trim() || m.email}
                  </option>
                ))}
              </select>
              {team.length > 0 && eligibleTeam.length === 0 && formService ? (
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Niko nije dostupan za ovu uslugu ili termin — proveri{" "}
                  <strong>Podešavanja → Raspored</strong> i dodeljene usluge.
                </p>
              ) : null}
            </div>

            {loyaltyLoading ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Provera loyalty programa…
              </p>
            ) : null}

            {!loyaltyLoading && loyaltyProgram ? (
              <div className="space-y-2 rounded-xl border border-violet-100 bg-violet-50/50 p-3 dark:border-violet-900 dark:bg-violet-950/25">
                <p className="text-xs font-medium text-violet-900 dark:text-violet-100">
                  Loyalty · {loyaltyProgram.name}
                </p>
                <p className="text-xs text-violet-800/90 dark:text-violet-200/90">
                  Napredak:{" "}
                  <strong className="tabular-nums">
                    {loyaltyProgram.stamps} / {loyaltyProgram.visits_required}
                  </strong>{" "}
                  pečata · dostupnih nagrada:{" "}
                  <strong className="tabular-nums">
                    {loyaltyProgram.rewards_available}
                  </strong>
                </p>
                {loyaltyProgram.rewards_available > 0 ? (
                  <label className="flex cursor-pointer items-start gap-2 text-sm text-violet-950 dark:text-violet-50">
                    <input
                      type="checkbox"
                      checked={redeemLoyalty}
                      onChange={(e) => setRedeemLoyalty(e.target.checked)}
                      className="mt-0.5 rounded border-violet-300"
                    />
                    <span>
                      Iskoristi besplatnu posetu (nagrada se potvrđuje kad se
                      termin označi kao završen).
                    </span>
                  </label>
                ) : (
                  <p className="text-xs text-violet-800/80 dark:text-violet-200/80">
                    Još nemaš nagradu — nastavi da skupljaš pečate završenim
                    posetama.
                  </p>
                )}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="cal-start">Početak</Label>
              <Input
                id="cal-start"
                type="datetime-local"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                required
              />
            </div>

            {availabilityFromShifts &&
            slotChips.length === 0 &&
            selectedService ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                Nema slobodnih termina u smenama za ovu uslugu i dan (ili su svi
                zakazani). Proveri <strong>Smena</strong> ili izaberi drugi dan.
              </p>
            ) : null}

            {slotChips.length > 0 ? (
              <div className="space-y-2 rounded-xl border border-sky-100 bg-sky-50/50 p-3 dark:border-sky-900 dark:bg-sky-950/30">
                <p className="text-xs font-medium text-sky-900 dark:text-sky-100">
                  {availabilityFromShifts
                    ? "Slobodni termini (po smenama)"
                    : "Predloženi termini (radno vreme)"}{" "}
                  · {orgTz}
                </p>
                <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                  {slotChips.map((slot) => (
                    <Button
                      key={slot.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "text-xs font-medium",
                        slot.source === "shifts"
                          ? slot.soon
                            ? "rounded-lg border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100"
                            : "rounded-lg border-emerald-200 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
                          : "rounded-lg border-sky-200 bg-white dark:border-sky-800 dark:bg-slate-900",
                        formStart ===
                          isoToDatetimeLocalValue(slot.startIso) &&
                          "ring-2 ring-sky-500"
                      )}
                      onClick={() => {
                        setFormStart(isoToDatetimeLocalValue(slot.startIso));
                        if (slot.employeeId != null) {
                          setFormStaff(String(slot.employeeId));
                        }
                      }}
                    >
                      {slot.label}
                      {slot.soon ? " · uskoro" : ""}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {busyChips.length > 0 ? (
              <div className="space-y-2 rounded-xl border border-rose-100 bg-rose-50/40 p-3 dark:border-rose-900 dark:bg-rose-950/25">
                <p className="text-xs font-medium text-rose-900 dark:text-rose-100">
                  Zauzeto (zakazano)
                </p>
                <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto">
                  {busyChips.map((b) => (
                    <span
                      key={b.key}
                      className="rounded-lg border border-rose-200 bg-rose-100/80 px-2 py-1 text-[11px] font-medium text-rose-950 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formSms}
                  onChange={(e) => setFormSms(e.target.checked)}
                  className="rounded border-sky-300"
                />
                Pošalji SMS
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formWa}
                  onChange={(e) => setFormWa(e.target.checked)}
                  className="rounded border-sky-300"
                />
                Pošalji WhatsApp
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formEmail}
                  onChange={(e) => setFormEmail(e.target.checked)}
                  className="rounded border-sky-300"
                />
                Pošalji e-mail
              </label>
            </div>
            {formEmail && !selectedClient?.email?.trim() ? (
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Izabrani klijent nema e-mail na kartici — otvori{" "}
                <Link
                  href="/clients"
                  className="font-medium underline underline-offset-2"
                >
                  Klijenti
                </Link>{" "}
                i unesi adresu.
              </p>
            ) : null}
          </div>
          <DialogFooter className="border-t-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Otkaži
            </Button>
            <Button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700"
              disabled={saving}
            >
              {saving ? "Čuvam…" : "Sačuvaj"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
