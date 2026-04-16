"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, ChevronRight, Sparkles, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import {
  WorkingHoursEditor,
  parseWorkingHoursFromApi,
  workingHoursToPayload,
  type DayScheduleRow,
} from "@/components/settings/working-hours-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SurfaceCard } from "@/components/ui/surface-card";
import { createService, patchSettings } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatYyyyMmDd, todayLocal } from "@/lib/dateLocal";
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";

const TOTAL_STEPS = 5;
const ONBOARDING_PENDING_KEY = "salon_onboarding_pending";
const ONBOARDING_DONE_KEY = "salon_onboarding_done";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { settings, refreshSettings } = useOrganization();

  const [allowed, setAllowed] = useState(false);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [salonName, setSalonName] = useState("");
  const [salonAddress, setSalonAddress] = useState("");
  const [salonPhone, setSalonPhone] = useState("");

  const [svc1Name, setSvc1Name] = useState("");
  const [svc1Price, setSvc1Price] = useState("2500");
  const [svc1Dur, setSvc1Dur] = useState("60");
  const [svc2Name, setSvc2Name] = useState("");
  const [svc2Price, setSvc2Price] = useState("");
  const [svc2Dur, setSvc2Dur] = useState("45");

  const [dayRows, setDayRows] = useState<DayScheduleRow[]>(() =>
    parseWorkingHoursFromApi(undefined)
  );

  const debouncedSalon = useDebouncedValue(
    {
      name: salonName,
      address: salonAddress,
      phone: salonPhone,
    },
    650
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (sessionStorage.getItem(ONBOARDING_PENDING_KEY) !== "1") {
      router.replace("/dashboard");
      return;
    }
    setAllowed(true);
  }, [router]);

  useEffect(() => {
    if (!settings) {
      return;
    }
    setSalonName((prev) => prev || settings.name || "");
    setSalonAddress((prev) => prev || settings.address || "");
    setSalonPhone((prev) => prev || settings.phone || "");
    setDayRows(parseWorkingHoursFromApi(settings.working_hours as Record<string, unknown>));
  }, [settings]);

  useEffect(() => {
    if (step !== 1 || !user || user.role !== "admin") {
      return;
    }
    const name = debouncedSalon.name.trim();
    if (!name) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await patchSettings({
          name,
          address: debouncedSalon.address.trim() || null,
          phone: debouncedSalon.phone.trim() || null,
        });
        if (!cancelled) {
          await refreshSettings();
        }
      } catch {
        /* tiha greška — korisnik može ponovo na „Dalje“ */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSalon, refreshSettings, step, user]);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }
    if (user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [authLoading, router, user]);

  function skipAll() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ONBOARDING_PENDING_KEY);
      localStorage.setItem(ONBOARDING_DONE_KEY, "skipped");
    }
    toast.message("Možete dopuniti podatke kasnije u Podešavanjima.");
    router.replace("/dashboard");
  }

  async function onNext() {
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!salonName.trim()) {
        toast.error("Unesite ime salona.");
        return;
      }
      setBusy(true);
      try {
        await patchSettings({
          name: salonName.trim(),
          address: salonAddress.trim() || null,
          phone: salonPhone.trim() || null,
        });
        await refreshSettings();
        setStep(2);
      } catch {
        toast.error("Čuvanje salona nije uspelo.");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step === 2) {
      setBusy(true);
      try {
        const tasks: Promise<unknown>[] = [];
        if (svc1Name.trim()) {
          const p = Number(String(svc1Price).replace(",", "."));
          const d = Number(svc1Dur);
          tasks.push(
            createService({
              name: svc1Name.trim(),
              price: Number.isFinite(p) ? p : 0,
              duration: Number.isFinite(d) ? d : 60,
            })
          );
        }
        if (svc2Name.trim()) {
          const p = Number(String(svc2Price || "0").replace(",", "."));
          const d = Number(svc2Dur);
          tasks.push(
            createService({
              name: svc2Name.trim(),
              price: Number.isFinite(p) ? p : 0,
              duration: Number.isFinite(d) ? d : 45,
            })
          );
        }
        if (tasks.length > 0) {
          await Promise.all(tasks);
        }
        await refreshSettings();
        setStep(3);
      } catch {
        toast.error("Usluge nisu sačuvane. Proveri cenu i pokušaj ponovo.");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step === 3) {
      setBusy(true);
      try {
        await patchSettings({
          working_hours: workingHoursToPayload(dayRows),
        });
        await refreshSettings();
        setStep(4);
      } catch {
        toast.error("Radno vreme nije sačuvano.");
      } finally {
        setBusy(false);
      }
    }
  }

  function finish() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ONBOARDING_PENDING_KEY);
      localStorage.setItem(ONBOARDING_DONE_KEY, "1");
    }
    toast.success("Spremni ste za rad!");
    router.replace("/dashboard");
  }

  if (!allowed || authLoading || !user) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">Učitavanje…</p>
    );
  }

  if (user.role !== "admin") {
    return null;
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const todayYmd = formatYyyyMmDd(todayLocal());
  const weekCal = `/calendar?day=${encodeURIComponent(todayYmd)}&view=week`;
  const displaySalon =
    salonName.trim() || settings?.name?.trim() || "vaš salon";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Prvi ulaz
          </p>
          <h1 className="font-heading text-2xl font-medium tracking-tight text-slate-900 dark:text-slate-50">
            Podešavanje salona
          </h1>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-slate-600"
          onClick={skipAll}
        >
          Preskoči
        </Button>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-zinc-900 transition-[width] duration-300 ease-out dark:bg-zinc-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <SurfaceCard padding="lg" className="shadow-md">
        {step === 0 ? (
          <div className="space-y-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
              <Sparkles className="size-6" aria-hidden />
            </div>
            <h2 className="font-heading text-xl font-medium text-slate-900 dark:text-slate-50">
              Dobrodošli u vaš salon sistem
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Par kratkih koraka: osnovni podaci, usluge i radno vreme. Sve možete
              kasnije promeniti u Podešavanjima.
            </p>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <h2 className="font-heading text-xl font-medium text-slate-900 dark:text-slate-50">
              Osnovni podaci
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Ime salona, adresa i telefon. Dok ste na ovom koraku, izmene se
              automatski šalju na server (autosave).
            </p>
            <div className="space-y-2">
              <Label htmlFor="onb-name">Ime salona</Label>
              <Input
                id="onb-name"
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                autoComplete="organization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onb-addr">Adresa</Label>
              <Input
                id="onb-addr"
                value={salonAddress}
                onChange={(e) => setSalonAddress(e.target.value)}
                autoComplete="street-address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onb-phone">Telefon</Label>
              <Input
                id="onb-phone"
                value={salonPhone}
                onChange={(e) => setSalonPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <h2 className="font-heading text-xl font-medium text-slate-900 dark:text-slate-50">
              Usluge
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Dodajte jednu ili dve usluge — ime, cena (RSD) i trajanje u minutima.
            </p>
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Usluga 1
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="s1n">Naziv</Label>
                  <Input
                    id="s1n"
                    value={svc1Name}
                    onChange={(e) => setSvc1Name(e.target.value)}
                    placeholder="npr. Šišanje"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s1p">Cena</Label>
                  <Input
                    id="s1p"
                    inputMode="decimal"
                    value={svc1Price}
                    onChange={(e) => setSvc1Price(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s1d">Minuti</Label>
                  <Input
                    id="s1d"
                    inputMode="numeric"
                    value={svc1Dur}
                    onChange={(e) => setSvc1Dur(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Usluga 2 (opciono)
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="s2n">Naziv</Label>
                  <Input
                    id="s2n"
                    value={svc2Name}
                    onChange={(e) => setSvc2Name(e.target.value)}
                    placeholder="npr. Manikir"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s2p">Cena</Label>
                  <Input
                    id="s2p"
                    inputMode="decimal"
                    value={svc2Price}
                    onChange={(e) => setSvc2Price(e.target.value)}
                    placeholder="opciono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s2d">Minuti</Label>
                  <Input
                    id="s2d"
                    inputMode="numeric"
                    value={svc2Dur}
                    onChange={(e) => setSvc2Dur(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-medium text-slate-900 dark:text-slate-50">
              Radno vreme
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Uključite dane i podesite otvaranje i zatvaranje.
            </p>
            <WorkingHoursEditor value={dayRows} onChange={setDayRows} />
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-5 text-center sm:text-left">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 sm:mx-0">
              <Check className="size-7" aria-hidden />
            </div>
            <h2 className="font-heading text-xl font-medium text-slate-900 dark:text-slate-50">
              Dobrodošli, {displaySalon}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Spremni ste za rad.{" "}
              <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] dark:border-slate-600 dark:bg-slate-800">
                Ctrl+K
              </kbd>{" "}
              otvara komandnu paletu — kao u Linearu.
            </p>
            <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-sky-50/80 to-white p-4 dark:border-slate-700 dark:from-sky-950/30 dark:to-zinc-950">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Pregled (primer)
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:text-left">
                <div className="rounded-xl bg-white/90 px-2 py-3 shadow-sm dark:bg-zinc-900/80">
                  <TrendingUp className="mx-auto mb-1 size-4 text-sky-600 sm:mx-0" aria-hidden />
                  <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-50">
                    12,4k
                  </p>
                  <p className="text-[10px] text-slate-500">RSD danas</p>
                </div>
                <div className="rounded-xl bg-white/90 px-2 py-3 shadow-sm dark:bg-zinc-900/80">
                  <Users className="mx-auto mb-1 size-4 text-violet-600 sm:mx-0" aria-hidden />
                  <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-50">
                    8
                  </p>
                  <p className="text-[10px] text-slate-500">Termina</p>
                </div>
                <div className="rounded-xl bg-white/90 px-2 py-3 shadow-sm dark:bg-zinc-900/80">
                  <Sparkles className="mx-auto mb-1 size-4 text-amber-600 sm:mx-0" aria-hidden />
                  <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-50">
                    96%
                  </p>
                  <p className="text-[10px] text-slate-500">Zadovoljstvo</p>
                </div>
              </div>
            </div>
            <Link
              href={weekCal}
              className={cn(
                buttonVariants({ variant: "brand", size: "lg" }),
                "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl shadow-md no-underline sm:w-auto"
              )}
            >
              <CalendarPlus className="size-4" aria-hidden />
              Zakaži prvi termin
            </Link>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-6 dark:border-slate-800">
          {step > 0 && step < 4 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={busy}
            >
              Nazad
            </Button>
          ) : null}
          {step < 4 ? (
            <Button
              type="button"
              variant="brand"
              className="gap-1 rounded-xl"
              onClick={() => void onNext()}
              disabled={busy}
            >
              {busy ? "Čuvam…" : step === 0 ? "Počni" : "Dalje"}
              {!busy ? <ChevronRight className="size-4" aria-hidden /> : null}
            </Button>
          ) : (
            <Button
              type="button"
              variant="brand"
              className="gap-1 rounded-xl"
              onClick={finish}
            >
              Uđi u aplikaciju
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
