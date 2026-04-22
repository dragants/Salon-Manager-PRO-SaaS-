"use client";

import { useParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
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
import { hexToRgbSpaceSeparated } from "@/lib/color-hex";
import { mapsSearchUrl, telHref } from "@/lib/contact-links";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Check,
  CircleCheck,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react";

const BOOKING_STEPS = [
  { id: 1 as const, label: "Usluga", short: "Usluga", Icon: Sparkles },
  { id: 2 as const, label: "Datum", short: "Datum", Icon: CalendarDays },
  { id: 3 as const, label: "Termin", short: "Termin", Icon: Clock },
  { id: 4 as const, label: "Podaci", short: "Podaci", Icon: UserRound },
] as const;

function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = s.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h % 360);
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function WorkerAvatar({
  name,
  employeeId,
  size = "md",
  className,
}: {
  name: string | null | undefined;
  employeeId?: number | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const label = name?.trim() || "Tim";
  const initials = initialsFromName(label);
  const hue = hueFromString(
    `${employeeId ?? ""}:${label}`
  );
  const sizeCls =
    size === "sm"
      ? "size-7 text-[10px] ring-2"
      : "size-9 text-xs ring-2";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold tabular-nums text-white shadow-inner ring-background",
        sizeCls,
        className
      )}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 65% 52%) 0%, hsl(${(hue + 38) % 360} 55% 38%) 100%)`,
      }}
      aria-hidden
      title={name || undefined}
    >
      <span className="drop-shadow-sm">{initials}</span>
    </div>
  );
}

function BookingStepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <nav
      className="rounded-2xl border border-border/80 bg-card/90 px-2 py-4 shadow-[var(--smp-shadow-soft)] backdrop-blur-sm sm:px-4"
      aria-label="Koraci rezervacije"
    >
      <ol className="flex w-full items-center">
        {BOOKING_STEPS.map(({ id, label, short, Icon }, index) => {
          const done = step > id;
          const active = step === id;
          const prevId = index > 0 ? BOOKING_STEPS[index - 1].id : null;
          const segmentDone = prevId != null && step > prevId;

          return (
            <Fragment key={id}>
              {index > 0 ? (
                <li
                  className="mx-1 flex h-11 min-w-[12px] flex-1 items-center sm:mx-2 sm:h-12"
                  aria-hidden
                >
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        segmentDone
                          ? "w-full bg-primary shadow-[0_0_12px_-2px_rgb(var(--primary)/0.65)]"
                          : "w-0 bg-primary"
                      )}
                    />
                  </div>
                </li>
              ) : null}
              <li className="flex w-[4.25rem] shrink-0 flex-col items-center sm:w-[5.25rem]">
                <div
                  className={cn(
                    "relative flex size-11 items-center justify-center rounded-2xl border-2 transition-all duration-300 sm:size-12",
                    done &&
                      "border-primary bg-primary text-primary-foreground shadow-[0_10px_28px_-10px_rgb(var(--primary)/0.65)]",
                    active &&
                      !done &&
                      "scale-105 border-primary bg-primary/15 text-primary shadow-[0_0_0_4px_rgb(var(--primary)/0.14)] ring-2 ring-primary/30",
                    !active &&
                      !done &&
                      "border-border bg-muted/60 text-muted-foreground"
                  )}
                >
                  {done ? (
                    <Check className="size-5" strokeWidth={2.75} />
                  ) : (
                    <Icon className="size-5" strokeWidth={2} />
                  )}
                  {active ? (
                    <span className="absolute -bottom-1.5 left-1/2 size-2 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_0_3px_var(--background)]" />
                  ) : null}
                </div>
                <span
                  className={cn(
                    "mt-2 hidden max-w-[5.25rem] truncate text-center text-[10px] font-bold uppercase leading-tight tracking-wide sm:block",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    "mt-2 max-w-[4.25rem] truncate text-center text-[9px] font-bold uppercase leading-tight tracking-wide sm:hidden",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {short}
                </span>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

function BookingProgressBar({ step }: { step: 1 | 2 | 3 | 4 }) {
  const pct = (step / 4) * 100;
  return (
    <div className="space-y-2">
      <div
        className="h-2 overflow-hidden rounded-full bg-muted/80 ring-1 ring-border/60"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Napredak: korak ${step} od 4`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-primary/80 shadow-[0_0_20px_-4px_rgb(var(--primary)/0.7)] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span>
          Korak {step} / 4 — {BOOKING_STEPS[step - 1]?.label}
        </span>
        <span className="tabular-nums text-primary">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

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

  const bookingThemeStyle = useMemo((): CSSProperties | undefined => {
    const hex = salonData?.salon.theme_color?.trim();
    if (!hex) return undefined;
    const rgb = hexToRgbSpaceSeparated(hex);
    if (!rgb) return undefined;
    return { ["--primary" as string]: rgb } as CSSProperties;
  }, [salonData?.salon.theme_color]);

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
        style={bookingThemeStyle}
        className="min-h-dvh touch-manipulation bg-gradient-to-b from-emerald-50/90 to-background px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px)+1rem)] pt-[max(2.5rem,env(safe-area-inset-top,0px)+0.5rem)] dark:from-emerald-950/40"
      >
        <div className="mx-auto flex max-w-lg flex-col gap-6">
          <SurfaceCard
            padding="lg"
            className="space-y-5 border-emerald-200/80 bg-card/95 text-center dark:border-emerald-900"
          >
            <div className="flex justify-center" aria-hidden>
              <CircleCheck
                className="size-16 text-emerald-600 dark:text-emerald-400"
                strokeWidth={1.25}
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Termin zakazan
              </h1>
              <p className="text-sm text-muted-foreground">
                {success.summary}
              </p>
              <p className="text-xs text-muted-foreground">
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
          <p className="text-center text-xs text-muted-foreground/70">
            Hvala što koristite {salon.name}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      id="main-content"
      style={bookingThemeStyle}
      className="min-h-dvh touch-manipulation bg-gradient-to-b from-primary/10 via-background to-background px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px)+1rem)] pt-[max(2.5rem,env(safe-area-inset-top,0px)+0.5rem)]"
    >
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <header className="overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-primary/15 via-card to-background p-6 text-center shadow-[var(--smp-shadow-soft)] ring-1 ring-primary/10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Online rezervacija
          </p>
          <div className="mt-4 flex flex-col items-center gap-3">
            {salon.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={salon.logo}
                alt=""
                className="h-20 w-20 rounded-3xl object-cover shadow-md ring-2 ring-primary/15"
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/15 font-heading text-2xl font-bold text-primary shadow-inner"
                aria-hidden
              >
                {salon.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {salon.name}
            </h1>
          </div>
          {salon.address ? (
            <p className="mt-4 flex items-start justify-center gap-2 text-sm text-muted-foreground">
              <MapPin
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <span>
                {mapsSearchUrl(salon.address) ? (
                  <a
                    href={mapsSearchUrl(salon.address)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary/90"
                  >
                    {salon.address}
                  </a>
                ) : (
                  salon.address
                )}
                {mapsSearchUrl(salon.address) ? (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Otvara Google mape
                  </span>
                ) : null}
              </span>
            </p>
          ) : null}
          {salon.phone ? (
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Phone className="size-4 shrink-0 text-primary" aria-hidden />
              {telHref(salon.phone) ? (
                <a
                  href={telHref(salon.phone)!}
                  className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary/90"
                >
                  {salon.phone}
                </a>
              ) : (
                salon.phone
              )}
            </p>
          ) : null}
        </header>

        <div className="space-y-4">
          <BookingProgressBar step={step} />
          <BookingStepper step={step} />
        </div>

        {step === 1 ? (
          <SurfaceCard
            padding="md"
            className="space-y-4 border-border/90 shadow-[var(--smp-shadow-soft)] ring-1 ring-primary/5"
          >
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="size-4" aria-hidden />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Izaberi uslugu
                </h2>
                <p className="text-xs text-muted-foreground">
                  Jedan klik — odmah vidiš trajanje i cenu.
                </p>
              </div>
            </div>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ovaj salon još nema javnih usluga za rezervaciju.
              </p>
            ) : (
              <div className="grid gap-2.5">
                {services.map((s) => {
                  const selected = serviceId === s.id;
                  const priceNum = Number(
                    String(s.price).replace(/\s/g, "").replace(",", ".")
                  );
                  const priceLabel = Number.isFinite(priceNum)
                    ? `${priceNum.toLocaleString("sr-RS")} RSD`
                    : `${s.price} RSD`;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setServiceId(s.id)}
                      className={cn(
                        "group flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-200",
                        selected
                          ? "border-primary bg-gradient-to-br from-primary/12 via-card to-card shadow-[0_12px_36px_-18px_rgb(var(--primary)/0.45)] ring-4 ring-primary/15"
                          : "border-border bg-card hover:border-primary/40 hover:bg-primary/[0.04] hover:shadow-md active:scale-[0.99]"
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-2xl transition-colors",
                          selected
                            ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_rgb(var(--primary)/0.55)]"
                            : "bg-primary/10 text-primary group-hover:bg-primary/15"
                        )}
                      >
                        <Sparkles className="size-5" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug text-foreground">
                          {s.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/80">
                            {Number(s.duration)} min
                          </span>
                          <span className="mx-1.5 text-border">·</span>
                          <span>{priceLabel}</span>
                        </p>
                      </div>
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-transparent bg-muted/60 text-transparent group-hover:border-border group-hover:text-muted-foreground"
                        )}
                      >
                        <Check className="size-4" strokeWidth={2.75} />
                      </div>
                    </button>
                  );
                })}
              </div>
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
          <SurfaceCard
            padding="md"
            className="space-y-4 border-border/90 shadow-[var(--smp-shadow-soft)] ring-1 ring-primary/5"
          >
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <CalendarDays className="size-4" aria-hidden />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Izaberi datum
                </h2>
                <p className="text-xs text-muted-foreground">
                  Brzi izbor ili tačan datum u kalendaru.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { label: "Danas", d: 0 },
                  { label: "Sutra", d: 1 },
                  { label: "Za 2 dana", d: 2 },
                ] as const
              ).map(({ label, d }) => {
                const ymd = formatYyyyMmDd(addDays(todayLocal(), d));
                const picked = date === ymd;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setDate(ymd)}
                    className={cn(
                      "rounded-2xl border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                      picked
                        ? "border-primary bg-primary text-primary-foreground shadow-[0_10px_28px_-12px_rgb(var(--primary)/0.55)] ring-2 ring-primary/25"
                        : "border-border bg-muted/40 text-foreground hover:border-primary/40 hover:bg-primary/5 dark:bg-muted/25"
                    )}
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
              className="border-border bg-card"
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
          <SurfaceCard
            padding="md"
            className="space-y-4 border-border/90 shadow-[var(--smp-shadow-soft)] ring-1 ring-primary/5"
          >
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Clock className="size-4" aria-hidden />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Slobodni termini
                </h2>
                <p className="text-xs text-muted-foreground">
                  Izaberi vreme{fromShifts ? " i osobu" : ""} — izabrani termin
                  je jasno označen.
                </p>
              </div>
            </div>
            {slotsLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div
                  className="size-9 animate-pulse rounded-full bg-sky-200/90 dark:bg-sky-900/60"
                  aria-hidden
                />
                <p className="text-sm font-medium text-muted-foreground">
                  Učitavanje termina…
                </p>
              </div>
            ) : slotsError ? (
              <p className="text-sm text-red-700 dark:text-red-300">
                {slotsError}
              </p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nema slobodnih termina za ovaj dan. Izaberi drugi datum ili
                proveri radno vreme u podešavanjima salona.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {slots.map((slot) => {
                  const isSelected =
                    selectedSlot?.start === slot.start &&
                    selectedSlot?.employee_id === slot.employee_id;
                  const workerLabel = slot.employee_name ?? "Tim salona";
                  return (
                    <button
                      key={`${slot.start}-${slot.employee_id ?? "x"}`}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "group relative flex flex-col gap-2 rounded-2xl border-2 px-3 py-3 text-left transition-all duration-200",
                        isSelected
                          ? "z-10 border-primary bg-gradient-to-b from-primary to-primary/90 text-primary-foreground shadow-[0_14px_44px_-18px_rgb(var(--primary)/0.75)] ring-4 ring-primary/30 scale-[1.02]"
                          : "border-border bg-card text-foreground hover:border-primary/45 hover:bg-primary/[0.06] hover:shadow-md active:scale-[0.98] dark:bg-card"
                      )}
                    >
                      {isSelected ? (
                        <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground backdrop-blur-[2px]">
                          <Check className="size-3.5" strokeWidth={3} />
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "pr-7 text-lg font-bold tabular-nums leading-none tracking-tight",
                          isSelected ? "text-primary-foreground" : "text-foreground"
                        )}
                      >
                        {slot.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <WorkerAvatar
                          name={workerLabel}
                          employeeId={slot.employee_id}
                          size="sm"
                          className={cn(
                            "ring-2",
                            isSelected
                              ? "ring-primary-foreground/35"
                              : "ring-background"
                          )}
                        />
                        <span
                          className={cn(
                            "line-clamp-2 min-w-0 flex-1 text-[11px] font-semibold leading-tight",
                            isSelected
                              ? "text-primary-foreground/95"
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                        >
                          {workerLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
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
          <SurfaceCard
            padding="md"
            className="space-y-4 border-border/90 shadow-[var(--smp-shadow-soft)] ring-1 ring-primary/5"
          >
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <UserRound className="size-4" aria-hidden />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Vaši podaci
                </h2>
                <p className="text-xs text-muted-foreground">
                  Proveri rezime ispod, unesi kontakt i potvrdi.
                </p>
              </div>
            </div>
            {selectedService && selectedSlot ? (
              <div className="flex gap-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-muted/80 to-muted/40 p-4 text-xs shadow-inner ring-1 ring-primary/10">
                <WorkerAvatar
                  name={selectedSlot.employee_name ?? "Tim salona"}
                  employeeId={selectedSlot.employee_id}
                  className="ring-2 ring-background"
                />
                <div className="min-w-0 flex-1 space-y-1 text-muted-foreground">
                  <p className="text-sm font-semibold text-foreground">
                    {selectedService.name}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-medium">
                    <CalendarDays
                      className="size-3.5 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span>{date}</span>
                    <span className="text-border">·</span>
                    <Clock
                      className="size-3.5 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span>{selectedSlot.label}</span>
                  </p>
                  {selectedSlot.employee_name ? (
                    <p className="text-[11px]">
                      Sa {selectedSlot.employee_name}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pb-name">Ime i prezime</Label>
                <Input
                  id="pb-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-border bg-card"
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
                  className="border-border bg-card"
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
                    <span className="font-normal text-muted-foreground">
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
                  className="border-border bg-card"
                  autoComplete="email"
                  placeholder="ime@primer.com"
                  required={emailRequired}
                />
                {!emailRequired ? (
                  <p className="text-xs text-muted-foreground">
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

        <p className="text-center text-xs text-muted-foreground/70">
          Zakazivanje u vremenskoj zoni salona ({salonTz}). Adresa otvara mape,
          telefon poziv.
        </p>
      </div>
    </div>
  );
}
