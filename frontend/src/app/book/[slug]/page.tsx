"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, formatYyyyMmDd, todayLocal } from "@/lib/dateLocal";
import { browserTimeZone } from "@/components/features/calendar/calendar-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  fetchPublicSalon,
  fetchPublicSlots,
  postPublicBook,
  type PublicSalonPayload,
  type PublicSlot,
} from "@/lib/api/public-booking";
import { mapsSearchUrl, telHref } from "@/lib/contact-links";
import { cn } from "@/lib/utils";
import { CircleCheck } from "lucide-react";

const STEP_LABELS = ["Usluga", "Datum", "Termin", "Podaci"] as const;

function todayYmdLocal(): string {
  return new Date().toLocaleDateString("en-CA");
}

export default function PublicBookingPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const [salonData, setSalonData] = useState<PublicSalonPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [fromShifts, setFromShifts] = useState(false);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [success, setSuccess] = useState<{
    summary: string;
    notifyHint: string;
  } | null>(null);

  const [serviceId, setServiceId] = useState<number | "">("");
  const [date, setDate] = useState(todayYmdLocal);
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const clientTz = useMemo(() => browserTimeZone(), []);
  const salonTz = salonData?.salon.timezone ?? clientTz;

  const selectedService = useMemo(() => {
    if (!salonData || serviceId === "") return null;
    return salonData.services.find((s) => s.id === serviceId) ?? null;
  }, [salonData, serviceId]);

  useEffect(() => {
    if (!slug) {
      setLoadError("Nedostaje link salona.");
      return;
    }
    let cancelled = false;
    setLoadError(null);
    void (async () => {
      try {
        const data = await fetchPublicSalon(slug);
        if (cancelled) return;
        setSalonData(data);
        if (data.services.length > 0) {
          setServiceId(data.services[0].id);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Greška pri učitavanju.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const loadSlots = useCallback(async () => {
    if (!slug || serviceId === "" || !date) {
      setSlots([]);
      setFromShifts(false);
      return;
    }
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);
    try {
      const data = await fetchPublicSlots(slug, {
        service_id: serviceId,
        date,
        timezone: salonTz,
      });
      setSlots(data.slots);
      setFromShifts(data.from_shifts === true);
    } catch (e) {
      setSlots([]);
      setFromShifts(false);
      setSlotsError(e instanceof Error ? e.message : "Termini nisu učitani.");
    } finally {
      setSlotsLoading(false);
    }
  }, [slug, serviceId, date, salonTz]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  function resetBookingFlow() {
    setSuccess(null);
    setStep(1);
    setSelectedSlot(null);
    setName("");
    setPhone("");
    setEmail("");
    setFormError(null);
    void loadSlots();
  }

  async function onBook() {
    setFormError(null);
    if (serviceId === "" || !selectedSlot || !name.trim() || !phone.trim()) {
      setFormError("Izaberi uslugu, termin i unesi ime i telefon.");
      return;
    }
    if (
      salonData?.booking_notify?.public_booking_email === true &&
      !email.trim()
    ) {
      setFormError("Unesi e-mail adresu za potvrdu termina.");
      return;
    }
    if (fromShifts && selectedSlot.employee_id == null) {
      setFormError("Izaberi termin dodeljen konkretnom radniku.");
      return;
    }
    setSubmitting(true);
    try {
      const out = await postPublicBook(slug, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        service_id: serviceId,
        start: selectedSlot.start,
        timezone: salonTz,
        staff_user_id:
          fromShifts && selectedSlot.employee_id != null
            ? selectedSlot.employee_id
            : undefined,
      });
      const sms =
        out.notify?.sms === "sent" ? " SMS potvrda je poslata." : "";
      const wa =
        out.notify?.whatsapp === "sent"
          ? " WhatsApp potvrda je poslata."
          : "";
      const em =
        out.notify?.email === "sent" ? " E-mail potvrda je poslata." : "";
      const svc = selectedService?.name ?? "Usluga";
      setSuccess({
        summary: `${svc} · ${date} · ${selectedSlot.label}${
          selectedSlot.employee_name ? ` · ${selectedSlot.employee_name}` : ""
        }`,
        notifyHint: `${sms}${wa}${em}`.trim() || "Potvrda je zabeležena.",
      });
      setSelectedSlot(null);
      setName("");
      setPhone("");
      setEmail("");
      void loadSlots();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Rezervacija nije uspela.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div
        id="main-content"
        className="flex min-h-dvh items-center justify-center bg-background px-4 py-16"
      >
        <SurfaceCard
          padding="md"
          className="max-w-lg border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
        >
          {loadError}
        </SurfaceCard>
      </div>
    );
  }

  if (!salonData) {
    return (
      <div
        id="main-content"
        className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background"
      >
        <div
          className="size-10 animate-pulse rounded-2xl bg-sky-200/80 dark:bg-sky-900/50"
          aria-hidden
        />
        <p className="text-sm font-medium text-muted-foreground">
          Učitavanje…
        </p>
      </div>
    );
  }

  const { salon, services } = salonData;
  const emailRequired =
    salonData.booking_notify?.public_booking_email === true;

  if (success) {
    return (
      <div
        id="main-content"
        className="min-h-dvh touch-manipulation bg-gradient-to-b from-emerald-50/90 to-[#f8fafc] px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px)+1rem)] pt-[max(2.5rem,env(safe-area-inset-top,0px)+0.5rem)] dark:from-emerald-950/40 dark:to-slate-950"
      >
        <div className="mx-auto flex max-w-lg flex-col gap-6">
          <SurfaceCard
            padding="lg"
            className="space-y-5 border-emerald-200/80 bg-white/95 text-center dark:border-emerald-900 dark:bg-slate-900"
          >
            <div className="flex justify-center" aria-hidden>
              <CircleCheck
                className="size-16 text-emerald-600 dark:text-emerald-400"
                strokeWidth={1.25}
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Termin zakazan
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {success.summary}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                {success.notifyHint}
              </p>
            </div>
            <Button
              type="button"
              variant="brand"
              className="h-12 w-full rounded-xl"
              onClick={() => resetBookingFlow()}
            >
              Zakaži još jedan termin
            </Button>
          </SurfaceCard>
          <p className="text-center text-xs text-zinc-400">
            Hvala što koristite {salon.name}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      id="main-content"
      className="min-h-dvh touch-manipulation bg-gradient-to-b from-primary/10 via-background to-background px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px)+1rem)] pt-[max(2.5rem,env(safe-area-inset-top,0px)+0.5rem)]"
    >
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <header className="space-y-1 text-center">
          {salon.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={salon.logo}
              alt=""
              className="mx-auto h-16 w-16 rounded-2xl object-cover ring-1 ring-zinc-200"
            />
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {salon.name}
          </h1>
          {salon.address ? (
            <p className="text-sm text-zinc-600">
              {mapsSearchUrl(salon.address) ? (
                <a
                  href={mapsSearchUrl(salon.address)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
                >
                  {salon.address}
                </a>
              ) : (
                salon.address
              )}
            </p>
          ) : null}
          {salon.phone ? (
            <p className="text-sm text-zinc-600">
              {telHref(salon.phone) ? (
                <a
                  href={telHref(salon.phone)!}
                  className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
                >
                  {salon.phone}
                </a>
              ) : (
                salon.phone
              )}
            </p>
          ) : null}
        </header>

        <div className="space-y-2">
          <div className="flex gap-1.5">
            {STEP_LABELS.map((label, i) => {
              const n = (i + 1) as 1 | 2 | 3 | 4;
              const done = step > n;
              const active = step === n;
              return (
                <div key={label} className="flex-1 space-y-1">
                  <div
                    title={label}
                    className={cn(
                      "h-1.5 rounded-full transition-colors",
                      done || active
                        ? "bg-sky-600"
                        : "bg-zinc-200 dark:bg-zinc-700"
                    )}
                  />
                  <p
                    className={cn(
                      "text-center text-[10px] font-medium uppercase tracking-wide",
                      active
                        ? "text-sky-700 dark:text-sky-400"
                        : "text-zinc-400 dark:text-zinc-500"
                    )}
                  >
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {step === 1 ? (
          <SurfaceCard padding="md" className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Izaberi uslugu
            </h2>
            {services.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Ovaj salon još nema javnih usluga za rezervaciju.
              </p>
            ) : (
              <select
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-600 dark:bg-slate-900 dark:text-slate-100"
                value={serviceId === "" ? "" : String(serviceId)}
                onChange={(e) => {
                  const v = e.target.value;
                  setServiceId(v === "" ? "" : Number(v));
                }}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {Number(s.duration)} min
                  </option>
                ))}
              </select>
            )}
            <Button
              type="button"
              variant="brand"
              className="h-11 w-full rounded-xl"
              disabled={services.length === 0 || serviceId === ""}
              onClick={() => setStep(2)}
            >
              Dalje
            </Button>
          </SurfaceCard>
        ) : null}

        {step === 2 ? (
          <SurfaceCard padding="md" className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Izaberi datum
            </h2>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { label: "Danas", d: 0 },
                  { label: "Sutra", d: 1 },
                  { label: "Za 2 dana", d: 2 },
                ] as const
              ).map(({ label, d }) => {
                const ymd = formatYyyyMmDd(addDays(todayLocal(), d));
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setDate(ymd)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      date === ymd
                        ? "border-sky-600 bg-sky-600 text-white"
                        : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:border-zinc-300 dark:border-zinc-600 dark:bg-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <Input
              type="date"
              min={todayYmdLocal()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-zinc-200 bg-white"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 rounded-xl"
                onClick={() => setStep(1)}
              >
                Nazad
              </Button>
              <Button
                type="button"
                variant="brand"
                className="h-11 flex-1 rounded-xl"
                onClick={() => setStep(3)}
              >
                Dalje
              </Button>
            </div>
          </SurfaceCard>
        ) : null}

        {step === 3 ? (
          <SurfaceCard padding="md" className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Slobodni termini
            </h2>
            {slotsLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div
                  className="size-9 animate-pulse rounded-full bg-sky-200/90 dark:bg-sky-900/60"
                  aria-hidden
                />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Učitavanje termina…
                </p>
              </div>
            ) : slotsError ? (
              <p className="text-sm text-red-700 dark:text-red-300">
                {slotsError}
              </p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nema slobodnih termina za ovaj dan. Izaberi drugi datum ili
                proveri radno vreme u podešavanjima salona.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    key={`${slot.start}-${slot.employee_id ?? "x"}`}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      "flex flex-col gap-0.5 rounded-xl border px-2 py-2.5 text-center transition-colors",
                      selectedSlot?.start === slot.start &&
                        selectedSlot?.employee_id === slot.employee_id
                        ? "border-sky-600 bg-sky-600 text-white shadow-sm"
                        : "border-zinc-200 bg-white text-zinc-900 hover:border-sky-300 hover:bg-sky-50/80 dark:border-zinc-600 dark:bg-slate-900 dark:text-slate-100"
                    )}
                  >
                    <span className="text-sm font-semibold tabular-nums">
                      {slot.label}
                    </span>
                    {slot.employee_name ? (
                      <span
                        className={cn(
                          "line-clamp-2 text-[10px] font-medium leading-tight opacity-90",
                          selectedSlot?.start === slot.start &&
                            selectedSlot?.employee_id === slot.employee_id
                            ? "text-white/90"
                            : "text-zinc-500 dark:text-zinc-400"
                        )}
                      >
                        {slot.employee_name}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 rounded-xl"
                onClick={() => setStep(2)}
              >
                Nazad
              </Button>
              <Button
                type="button"
                variant="brand"
                className="h-11 flex-1 rounded-xl"
                disabled={!selectedSlot || slotsLoading}
                onClick={() => setStep(4)}
              >
                Dalje
              </Button>
            </div>
          </SurfaceCard>
        ) : null}

        {step === 4 ? (
          <SurfaceCard padding="md" className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Vaši podaci
            </h2>
            {selectedService && selectedSlot ? (
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-slate-800/50 dark:text-zinc-300">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">
                  {selectedService.name}
                </p>
                <p>
                  {date} · {selectedSlot.label}
                  {selectedSlot.employee_name
                    ? ` · ${selectedSlot.employee_name}`
                    : ""}
                </p>
              </div>
            ) : null}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pb-name">Ime i prezime</Label>
                <Input
                  id="pb-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-zinc-200 bg-white"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pb-phone">Telefon (za SMS potvrdu)</Label>
                <Input
                  id="pb-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border-zinc-200 bg-white"
                  autoComplete="tel"
                  placeholder="+381…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pb-email">
                  E-mail
                  {emailRequired ? (
                    <span className="font-normal text-red-600 dark:text-red-400">
                      {" "}
                      *
                    </span>
                  ) : (
                    <span className="font-normal text-zinc-500">
                      {" "}
                      (opciono)
                    </span>
                  )}
                </Label>
                <Input
                  id="pb-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-zinc-200 bg-white"
                  autoComplete="email"
                  placeholder="ime@primer.com"
                  required={emailRequired}
                />
                {!emailRequired ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ako ga uneseš, salon ga može koristiti za e-mail potvrdu i
                    podsetnike (ako su uključeni).
                  </p>
                ) : null}
              </div>
            </div>
            {formError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
                {formError}
              </p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 rounded-xl"
                disabled={submitting}
                onClick={() => setStep(3)}
              >
                Nazad
              </Button>
              <Button
                type="button"
                variant="brand"
                className="h-11 flex-1 rounded-xl"
                disabled={
                  submitting ||
                  services.length === 0 ||
                  serviceId === "" ||
                  !selectedSlot
                }
                onClick={() => void onBook()}
              >
                {submitting ? "Šaljem…" : "Rezerviši termin"}
              </Button>
            </div>
          </SurfaceCard>
        ) : null}

        <p className="text-center text-xs text-zinc-400">
          Zakazivanje u vremenskoj zoni salona ({salonTz}). Adresa otvara mape,
          telefon poziv.
        </p>
      </div>
    </div>
  );
}
