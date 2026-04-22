import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Globe,
  Package,
  Shield,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { sr } from "@/lib/i18n/sr";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: CalendarDays,
    title: "Pametan kalendar",
    desc: "Nedeljni i dnevni pregled, drag-and-drop, preklapanje termina se automatski sprečava.",
  },
  {
    icon: Users,
    title: "Klijenti i karton",
    desc: "Kompletan profil klijenta — istorija poseta, beleške, fajlovi, loyalty bodovi.",
  },
  {
    icon: Globe,
    title: "Online rezervacije",
    desc: "Javni link za zakazivanje — klijenti biraju uslugu, datum i termin bez poziva.",
  },
  {
    icon: Bell,
    title: "Podsetnici",
    desc: "SMS i push podsetnici 24h i 2h pre termina — manje propuštenih dolazaka.",
  },
  {
    icon: BarChart3,
    title: "Analitika i prihod",
    desc: "Trend zakazivanja, prihod po danima, mesečni finansijski pregled.",
  },
  {
    icon: Package,
    title: "Materijal i zalihe",
    desc: "Praćenje potrošnje, automatsko upozorenje kada zalihe padnu ispod minimuma.",
  },
  {
    icon: Clock,
    title: "Smene i radni sati",
    desc: "Planer smena za tim — koji radnik radi kad, bez konfuzije.",
  },
  {
    icon: Shield,
    title: "Sigurno i privatno",
    desc: "Šifrovana komunikacija, kontrola pristupa po ulozi, audit log svake promene.",
  },
] as const;

const featureLayoutClasses = [
  "lg:col-span-4 lg:row-span-2 min-h-[280px]",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-3",
  "lg:col-span-3",
] as const;

const plans = [
  {
    name: "Free",
    price: "0",
    period: "zauvek",
    desc: "Za male salone koji počinju.",
    features: [
      "Do 50 klijenata",
      "200 termina/mesec",
      "Kalendar i pregled",
      "Online rezervacije",
    ],
    cta: "Započni besplatno",
    ctaVariant: "outline" as const,
    highlight: false,
  },
  {
    name: "Pro",
    price: "2.990",
    period: "mesečno",
    desc: "Za ozbiljne salone sa timom.",
    features: [
      "Neograničeno klijenata",
      "Neograničeno termina",
      "SMS podsetnici",
      "Analitika i finansije",
      "Materijal i zalihe",
      "Loyalty program",
      "Prioritetna podrška",
    ],
    cta: "Isprobaj 7 dana besplatno",
    ctaVariant: "brand" as const,
    highlight: true,
  },
] as const;

const testimonials = [
  {
    quote:
      "Konačno nemam 15 propuštenih poziva dnevno. Klijenti sami zakazuju, ja samo radim.",
    name: "Marija K.",
    role: "Vlasnica studio masaže, Beograd",
  },
  {
    quote:
      "Pre sam imala svesku. Sada vidim tačno koliko zaradim i koji tretman je najpopularniji.",
    name: "Ana S.",
    role: "Kozmetički salon, Novi Sad",
  },
  {
    quote:
      "Tim od 4 frizera — smene, kalendar, podsetnike, sve rešava jedna aplikacija.",
    name: "Dragan P.",
    role: "Frizerski salon, Niš",
  },
] as const;

const salonLabels = [
  "Studio lepote · BG",
  "Wellness centar · NS",
  "Barber & spa · NI",
  "Kozmetika · KG",
  "Masaža & relaks · SC",
] as const;

function HeroProductScreenshot({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div
        className="absolute -inset-10 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/25 via-sky-500/10 to-transparent blur-2xl dark:from-primary/20"
        aria-hidden
      />
      <div className="relative lg:-translate-y-2 lg:translate-x-1">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_80px_-20px_rgb(0_0_0/0.35)] ring-1 ring-black/5 dark:ring-white/10">
          <div className="flex h-9 items-center gap-1.5 border-b border-border bg-muted/60 px-4">
            <span className="size-2.5 rounded-full bg-red-400/70" />
            <span className="size-2.5 rounded-full bg-amber-400/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-3 flex-1 rounded-md bg-muted px-3 py-0.5 text-center text-[10px] text-muted-foreground">
              app.salonmanagerpro.com/kalendar
            </span>
          </div>
          <div className="grid grid-cols-12 divide-x divide-border">
            <div className="col-span-3 hidden space-y-2 bg-muted/30 p-4 lg:block">
              {[
                "Dashboard",
                "Kalendar",
                "Klijenti",
                "Usluge",
                "Analitika",
                "Finansije",
              ].map((item, i) => (
                <div
                  key={item}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs font-medium",
                    i === 1
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="col-span-12 space-y-4 p-5 sm:p-6 lg:col-span-9">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Nedeljni pregled
                  </p>
                  <p className="mt-1 font-heading text-lg font-semibold text-foreground">
                    Kalendar — 22.–28. april
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    37 termina · 3 slobodna slota
                  </p>
                </div>
                <div className="rounded-xl bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary">
                  + Novi termin
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {Array.from({ length: 7 }).map((_, d) => (
                  <div key={d} className="space-y-1.5">
                    <div className="rounded-md bg-muted py-1 text-center text-[9px] font-medium text-muted-foreground sm:text-[10px]">
                      {["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"][d]}
                    </div>
                    {Array.from({
                      length: d === 2 ? 4 : d === 4 ? 3 : 2,
                    }).map((_, j) => (
                      <div
                        key={j}
                        className={cn(
                          "h-7 rounded-md sm:h-8",
                          j % 3 === 0
                            ? "bg-primary/25"
                            : j % 3 === 1
                              ? "bg-emerald-500/20"
                              : "bg-amber-500/15"
                        )}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <span className="rounded-full border border-border bg-background/80 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                  SMS podsetnik uključen
                </span>
                <span className="rounded-full border border-border bg-background/80 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                  Online booking aktivan
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [featured, ...restTestimonials] = testimonials;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden />
            <span className="font-heading text-lg font-semibold text-foreground">
              Salon Manager <span className="text-primary">PRO</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-xl"
              )}
            >
              Prijava
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: "brand", size: "sm" }),
                "rounded-xl"
              )}
            >
              Isprobaj besplatno
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            aria-hidden
          >
            <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-primary/15 blur-3xl dark:bg-primary/10" />
            <div className="absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-sky-500/10 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="max-w-xl lg:max-w-none">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Zap className="size-3" aria-hidden />
                  Za salone lepote, masaže i wellness
                </div>

                <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                  Upravljajte salonom{" "}
                  <span className="text-primary">bez haosa</span>
                </h1>

                <p className="mt-5 max-w-xl text-lg text-muted-foreground sm:text-xl">
                  Kalendar, klijenti, online rezervacije, podsetnici i finansije
                  — sve na jednom mestu. Manje poziva, više termina, jasniji
                  prihod.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link
                    href="/register"
                    className={cn(
                      buttonVariants({ variant: "brand", size: "lg" }),
                      "h-13 justify-center rounded-xl px-8 text-base shadow-[var(--smp-shadow-hover)] sm:min-w-[15rem]"
                    )}
                  >
                    Isprobaj 7 dana besplatno
                  </Link>
                  <Link
                    href="#funkcije"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "h-13 justify-center rounded-xl border-border px-8 text-base sm:min-w-[12rem]"
                    )}
                  >
                    Šta sve dobijam?
                  </Link>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  Bez kreditne kartice · Otkazivanje u bilo kom momentu
                </p>

                <dl className="mt-10 grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      k: "Start",
                      v: "0 RSD",
                      d: "Free plan, bez kartice",
                    },
                    {
                      k: "Setup",
                      v: "< 3 min",
                      d: "Salon, usluge, link",
                    },
                    {
                      k: "Podrška",
                      v: "Na srpskom",
                      d: "Za vlasnike salona",
                    },
                  ].map((row) => (
                    <div
                      key={row.k}
                      className="rounded-2xl border border-border/80 bg-card/60 px-4 py-3 shadow-[var(--smp-shadow-soft)] backdrop-blur-sm"
                    >
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {row.k}
                      </dt>
                      <dd className="mt-1 font-heading text-xl font-bold tabular-nums text-foreground">
                        {row.v}
                      </dd>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.d}
                      </p>
                    </div>
                  ))}
                </dl>
              </div>

              <HeroProductScreenshot className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none" />
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section
          className="relative border-y border-border bg-gradient-to-b from-muted/40 via-muted/25 to-background py-14 sm:py-20"
          aria-labelledby="social-proof-heading"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col gap-3 text-center lg:text-left">
              <p
                id="social-proof-heading"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
              >
                Poverenje
              </p>
              <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                Saloni koji žele red, a ne haos u terminima
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground lg:mx-0">
                Jedna platforma za zakazivanje, tim i finansije — da klijenti
                brže dolaze, a vi jasnije vidite dan.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {salonLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-border bg-card/90 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-stretch gap-6 lg:flex-row lg:items-start lg:gap-8">
              <figure className="relative flex-1 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-8 shadow-[var(--smp-shadow-hover)] lg:p-10">
                <div
                  className="absolute right-6 top-6 flex items-center gap-0.5 text-amber-500"
                  aria-label="Ocena pet zvezdica"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-4 fill-current"
                      aria-hidden
                    />
                  ))}
                </div>
                <blockquote className="relative z-10 pt-8 lg:pt-6">
                  <p className="font-heading text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                    &ldquo;{featured.quote}&rdquo;
                  </p>
                </blockquote>
                <figcaption className="relative z-10 mt-8 flex items-center gap-3 border-t border-border/60 pt-6">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 font-heading text-sm font-bold text-primary">
                    {featured.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {featured.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {featured.role}
                    </p>
                  </div>
                </figcaption>
              </figure>

              <div className="flex w-full flex-col gap-4 lg:w-[380px] lg:shrink-0">
                {restTestimonials.map(({ quote, name, role }) => (
                  <figure
                    key={name}
                    className="rounded-2xl border border-border bg-card p-6 shadow-[var(--smp-shadow-soft)]"
                  >
                    <blockquote>
                      <p className="text-sm leading-relaxed text-foreground">
                        &ldquo;{quote}&rdquo;
                      </p>
                    </blockquote>
                    <figcaption className="mt-4 border-t border-border pt-4">
                      <p className="text-sm font-semibold text-foreground">
                        {name}
                      </p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-border pt-10 text-sm text-muted-foreground lg:justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className="size-5 shrink-0 text-emerald-500"
                  aria-hidden
                />
                <span>Šifrovana komunikacija (HTTPS)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className="size-5 shrink-0 text-emerald-500"
                  aria-hidden
                />
                <span>Uloge i dozvole po članu tima</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className="size-5 shrink-0 text-emerald-500"
                  aria-hidden
                />
                <span>Online booking bez dodatnih alata</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features — bento */}
        <section
          id="funkcije"
          className="py-16 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Platforma
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Sve što vam treba za salon
              </h2>
              <p className="mt-3 text-muted-foreground">
                Od zakazivanja do finansijskog pregleda — u jednoj aplikaciji,
                sa jasnim modulima.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-6 lg:grid-rows-[auto_auto_auto]">
              {features.map(({ icon: Icon, title, desc }, i) => (
                <div
                  key={title}
                  className={cn(
                    "group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--smp-shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--smp-shadow-hover)]",
                    featureLayoutClasses[i]
                  )}
                >
                  <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                  {i === 0 ? (
                    <div className="mt-6 hidden h-24 rounded-xl bg-gradient-to-r from-primary/10 via-muted to-transparent lg:block" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works — timeline */}
        <section className="border-t border-border bg-muted/25 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Brzo pokretanje
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Počnite za 3 minuta
              </h2>
            </div>

            <div className="relative mx-auto mt-14 max-w-3xl lg:mx-0 lg:max-w-4xl">
              <div
                className="absolute left-[1.125rem] top-3 bottom-3 w-px bg-gradient-to-b from-primary/50 via-border to-transparent sm:left-6"
                aria-hidden
              />
              <ol className="relative space-y-12">
                {[
                  {
                    step: "1",
                    title: "Registrujte se",
                    desc: "Email, naziv salona — to je sve. Bez kartice.",
                  },
                  {
                    step: "2",
                    title: "Dodajte usluge",
                    desc: "Cena, trajanje, i odmah dobijate javni link za zakazivanje.",
                  },
                  {
                    step: "3",
                    title: "Primajte klijente",
                    desc: "Klijenti rezervišu sami, vi pratite kalendar i zaradu.",
                  },
                ].map(({ step, title, desc }) => (
                  <li key={step} className="relative flex gap-6 sm:gap-10">
                    <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-[var(--smp-shadow-soft)] ring-4 ring-muted/25 sm:size-12 sm:text-lg">
                      {step}
                    </div>
                    <div className="pb-2 pt-0.5">
                      <h3 className="text-lg font-semibold text-foreground">
                        {title}
                      </h3>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                        {desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="cene" className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Jednostavne cene
              </h2>
              <p className="mt-3 text-muted-foreground">
                Započnite besplatno, nadogradite kad budete spremni.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-3xl items-start gap-6 sm:grid-cols-2">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "relative rounded-2xl border p-6 shadow-[var(--smp-shadow-soft)] transition-all duration-200 sm:p-8",
                    plan.highlight
                      ? "border-primary bg-card ring-1 ring-primary/30 shadow-[var(--smp-shadow-hover)] sm:-translate-y-1"
                      : "border-border bg-card sm:translate-y-3"
                  )}
                >
                  {plan.highlight ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-sm">
                      Preporuka
                    </span>
                  ) : null}
                  <h3 className="text-lg font-semibold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.desc}
                  </p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tabular-nums text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      RSD / {plan.period}
                    </span>
                  </div>
                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <span className="mt-0.5 text-primary" aria-hidden>
                          ✓
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={cn(
                      buttonVariants({
                        variant: plan.ctaVariant,
                        size: "lg",
                      }),
                      "mt-8 w-full rounded-xl",
                      plan.highlight
                        ? "shadow-[var(--smp-shadow-soft)]"
                        : "border-border"
                    )}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          className="border-t border-border bg-muted/20 py-16 sm:py-24"
          aria-labelledby="landing-faq-heading"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2
              id="landing-faq-heading"
              className="text-center font-heading text-3xl font-bold tracking-tight sm:text-4xl"
            >
              {sr.landing.faqTitle}
            </h2>
            <div className="mt-10 space-y-2">
              {sr.landing.faq.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-2xl border border-border bg-card shadow-[var(--smp-shadow-soft)] transition-colors open:border-primary/20 open:shadow-[var(--smp-shadow-hover)]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <ChevronDown
                      className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <p className="border-t border-border px-5 pb-4 pt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border bg-gradient-to-br from-primary/15 via-muted/40 to-background py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Spremni da organizujete salon?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Registracija traje manje od minuta. Počnite besplatno, bez
              obaveza, bez unosa kartice.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: "brand", size: "lg" }),
                  "h-13 min-w-[16rem] rounded-xl px-8 text-base shadow-[var(--smp-shadow-hover)]"
                )}
              >
                Započni besplatno
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-13 rounded-xl border-border px-8 text-base"
                )}
              >
                Već imam nalog
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
