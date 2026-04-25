"use client";
import { useT } from "@/lib/i18n/locale";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { MapPin, Phone } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  fetchPublicSalon,
  fetchPublicSlots,
  postPublicBook,
  type PublicSalonPayload,
  type PublicSlot,
} from "@/lib/api/public-booking";
import { hexToRgbSpaceSeparated } from "@/lib/color-hex";
import { browserTimeZone } from "@/components/features/calendar/calendar-utils";
import { mapsSearchUrl, telHref } from "@/lib/contact-links";
import {
  type BookingStep,
  type BookingSuccess as BookingSuccessData,
  BookingProgressBar,
  BookingStepper,
  todayYmdLocal,
} from "@/components/features/booking/booking-shared";
import { StepSelectService } from "@/components/features/booking/StepSelectService";
import { StepSelectDate } from "@/components/features/booking/StepSelectDate";
import { StepSelectSlot } from "@/components/features/booking/StepSelectSlot";
import { StepClientForm } from "@/components/features/booking/StepClientForm";
import { BookingSuccess } from "@/components/features/booking/BookingSuccess";

export default function PublicBookingPage() {
  const t = useT();
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  /* ── Salon data ── */
  const [salonData, setSalonData] = useState<PublicSalonPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── Slots ── */
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [fromShifts, setFromShifts] = useState(false);

  /* ── Booking flow ── */
  const [step, setStep] = useState<BookingStep>(1);
  const [success, setSuccess] = useState<BookingSuccessData | null>(null);
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

  /* ── Load salon ── */
  useEffect(() => {
    if (!slug) { setLoadError(t.booking.missingLink); return; }
    let cancelled = false;
    setLoadError(null);
    void (async () => {
      try {
        const data = await fetchPublicSalon(slug);
        if (cancelled) return;
        setSalonData(data);
        if (data.services.length > 0) setServiceId(data.services[0].id);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Greška pri učitavanju.");
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  /* ── Load slots ── */
  const loadSlots = useCallback(async () => {
    if (!slug || serviceId === "" || !date) { setSlots([]); setFromShifts(false); return; }
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);
    try {
      const data = await fetchPublicSlots(slug, { service_id: serviceId, date, timezone: salonTz });
      setSlots(data.slots);
      setFromShifts(data.from_shifts === true);
    } catch (e) {
      setSlots([]);
      setFromShifts(false);
      setSlotsError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setSlotsLoading(false);
    }
  }, [slug, serviceId, date, salonTz]);

  useEffect(() => { void loadSlots(); }, [loadSlots]);

  /* ── Actions ── */
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
    if (salonData?.booking_notify?.public_booking_email === true && !email.trim()) {
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
        staff_user_id: fromShifts && selectedSlot.employee_id != null ? selectedSlot.employee_id : undefined,
      });
      const sms = out.notify?.sms === "sent" ? " SMS potvrda je poslata." : "";
      const wa = out.notify?.whatsapp === "sent" ? " WhatsApp potvrda je poslata." : "";
      const em = out.notify?.email === "sent" ? " E-mail potvrda je poslata." : "";
      const svc = selectedService?.name ?? "Usluga";
      setSuccess({
        summary: `${svc} · ${date} · ${selectedSlot.label}${selectedSlot.employee_name ? ` · ${selectedSlot.employee_name}` : ""}`,
        notifyHint: `${sms}${wa}${em}`.trim() || "Potvrda je zabeležena.",
      });
      setSelectedSlot(null);
      setName(""); setPhone(""); setEmail("");
      void loadSlots();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : t.booking.bookingFailed);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Guards ── */
  if (loadError) {
    return (
      <div id="main-content" className="flex min-h-dvh items-center justify-center bg-background px-4 py-16">
        <SurfaceCard padding="md" className="max-w-lg border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          {loadError}
        </SurfaceCard>
      </div>
    );
  }

  if (!salonData) {
    return (
      <div id="main-content" className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
        <div className="size-10 animate-pulse rounded-2xl bg-sky-200/80 dark:bg-sky-900/50" aria-hidden />
        <p className="text-sm font-medium text-muted-foreground">Učitavanje…</p>
      </div>
    );
  }

  const { salon, services } = salonData;
  const emailRequired = salonData.booking_notify?.public_booking_email === true;

  /* ── Success screen ── */
  if (success) {
    return (
      <div id="main-content" style={bookingThemeStyle} className="min-h-dvh touch-manipulation bg-gradient-to-b from-emerald-50/90 to-background px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px)+1rem)] pt-[max(2.5rem,env(safe-area-inset-top,0px)+0.5rem)] dark:from-emerald-950/40">
        <BookingSuccess salonName={salon.name} data={success} onReset={resetBookingFlow} />
      </div>
    );
  }

  /* ── Main booking flow ── */
  return (
    <div
      id="main-content"
      style={bookingThemeStyle}
      className="min-h-dvh touch-manipulation bg-gradient-to-b from-primary/10 via-background to-background px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px)+1rem)] pt-[max(2.5rem,env(safe-area-inset-top,0px)+0.5rem)]"
    >
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        {/* Header */}
        <header className="overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-primary/15 via-card to-background p-6 text-center shadow-[var(--smp-shadow-soft)] ring-1 ring-primary/10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Online rezervacija
          </p>
          <div className="mt-4 flex flex-col items-center gap-3">
            {salon.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={salon.logo} alt="" className="h-20 w-20 rounded-3xl object-cover shadow-md ring-2 ring-primary/15" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/15 font-heading text-2xl font-bold text-primary shadow-inner" aria-hidden>
                {salon.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {salon.name}
            </h1>
          </div>
          {salon.address ? (
            <p className="mt-4 flex items-start justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                {mapsSearchUrl(salon.address) ? (
                  <a href={mapsSearchUrl(salon.address)!} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary/90">
                    {salon.address}
                  </a>
                ) : salon.address}
              </span>
            </p>
          ) : null}
          {salon.phone ? (
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Phone className="size-4 shrink-0 text-primary" aria-hidden />
              {telHref(salon.phone) ? (
                <a href={telHref(salon.phone)!} className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary/90">
                  {salon.phone}
                </a>
              ) : salon.phone}
            </p>
          ) : null}
        </header>

        {/* Stepper */}
        <div className="space-y-4">
          <BookingProgressBar step={step} />
          <BookingStepper step={step} />
        </div>

        {/* Steps */}
        {step === 1 ? (
          <StepSelectService services={services} serviceId={serviceId} onSelect={setServiceId} onNext={() => setStep(2)} />
        ) : null}

        {step === 2 ? (
          <StepSelectDate date={date} onDateChange={setDate} onNext={() => setStep(3)} onBack={() => setStep(1)} />
        ) : null}

        {step === 3 ? (
          <StepSelectSlot slots={slots} slotsLoading={slotsLoading} slotsError={slotsError} fromShifts={fromShifts} selectedSlot={selectedSlot} onSelect={setSelectedSlot} onNext={() => setStep(4)} onBack={() => setStep(2)} />
        ) : null}

        {step === 4 ? (
          <StepClientForm
            selectedService={selectedService}
            selectedSlot={selectedSlot}
            date={date}
            name={name} phone={phone} email={email}
            emailRequired={emailRequired}
            formError={formError}
            submitting={submitting}
            onNameChange={setName} onPhoneChange={setPhone} onEmailChange={setEmail}
            onSubmit={() => void onBook()}
            onBack={() => setStep(3)}
            disabled={services.length === 0 || serviceId === "" || !selectedSlot}
          />
        ) : null}

        <p className="text-center text-xs text-muted-foreground/70">
          Zakazivanje u vremenskoj zoni salona ({salonTz}). Adresa otvara mape, telefon poziv.
        </p>
      </div>
    </div>
  );
}
