import Link from "next/link";
import {
  CalendarDays,
  BarChart3,
  Bell,
  Clock,
  Globe,
  Package,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HERO_SRC =
  "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1600&q=80";

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

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden />
            <span className="font-heading text-lg font-semibold text-foreground">
              Salon Manager{" "}
              <span className="text-primary">PRO</span>
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
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_SRC}
              alt=""
              className="size-full object-cover opacity-[0.07] dark:opacity-[0.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
          </div>

          <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Zap className="size-3" aria-hidden />
                Za salone lepote, masaže i wellness
              </div>

              <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Upravljajte salonom{" "}
                <span className="text-primary">bez haosa</span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                Kalendar, klijenti, online rezervacije, podsetnici i finansije
                — sve na jednom mestu. Manje poziva, više termina, jasniji
                prihod.
              </p>

              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ variant: "brand", size: "lg" }),
                    "h-13 min-w-[15rem] rounded-xl px-8 text-base shadow-[var(--lux-shadow-hover)]"
                  )}
                >
                  Isprobaj 7 dana besplatno
                </Link>
                <Link
                  href="#funkcije"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-13 min-w-[12rem] rounded-xl border-border px-8 text-base"
                  )}
                >
                  Šta sve dobijam?
                </Link>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Bez kreditne kartice · Otkazivanje u bilo kom momentu
              </p>
            </div>

            {/* Hero vizual — app screenshot mock */}
            <div className="mx-auto mt-14 max-w-5xl">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--lux-shadow-heavy)]">
                <div className="flex h-9 items-center gap-1.5 border-b border-border bg-muted/60 px-4">
                  <span className="size-2.5 rounded-full bg-red-400/60" />
                  <span className="size-2.5 rounded-full bg-amber-400/60" />
                  <span className="size-2.5 rounded-full bg-green-400/60" />
                  <span className="ml-3 flex-1 rounded-md bg-muted px-3 py-0.5 text-center text-[10px] text-muted-foreground">
                    app.salonmanagerpro.com
                  </span>
                </div>
                <div className="grid grid-cols-12 divide-x divide-border">
                  {/* Sidebar mock */}
                  <div className="col-span-3 hidden space-y-2 bg-muted/30 p-4 lg:block">
                    {["Dashboard", "Kalendar", "Klijenti", "Usluge", "Analitika", "Finansije"].map(
                      (item, i) => (
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
                      )
                    )}
                  </div>
                  {/* Content mock */}
                  <div className="col-span-12 space-y-3 p-5 lg:col-span-9">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="h-5 w-32 rounded bg-foreground/10" />
                        <div className="mt-1 h-3 w-48 rounded bg-foreground/5" />
                      </div>
                      <div className="h-8 w-24 rounded-lg bg-primary/20" />
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 7 }).map((_, d) => (
                        <div key={d} className="space-y-1">
                          <div className="h-3 rounded bg-muted text-center text-[8px] text-muted-foreground" />
                          {Array.from({
                            length: d === 2 ? 4 : d === 4 ? 3 : 2,
                          }).map((_, j) => (
                            <div
                              key={j}
                              className={cn(
                                "h-6 rounded",
                                j % 3 === 0
                                  ? "bg-primary/20"
                                  : j % 3 === 1
                                    ? "bg-emerald-500/15"
                                    : "bg-amber-500/10"
                              )}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features grid ────────────────────────────────────── */}
        <section
          id="funkcije"
          className="border-t border-border bg-muted/30 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Sve što vam treba za salon
              </h2>
              <p className="mt-3 text-muted-foreground">
                Od zakazivanja do finansijskog pregleda — u jednoj aplikaciji.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--lux-shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--lux-shadow-hover)]"
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Počnite za 3 minuta
              </h2>
            </div>
            <div className="mx-auto mt-12 grid max-w-3xl gap-8 sm:grid-cols-3">
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
                <div key={step} className="text-center">
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-[var(--lux-shadow-soft)]">
                    {step}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Social proof ─────────────────────────────────────── */}
        <section className="border-t border-border bg-muted/30 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="text-center font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Šta kažu vlasnici salona
            </h2>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3">
              {testimonials.map(({ quote, name, role }) => (
                <div
                  key={name}
                  className="rounded-2xl border border-border bg-card p-6 shadow-[var(--lux-shadow-soft)]"
                >
                  <p className="text-sm leading-relaxed text-foreground">
                    &ldquo;{quote}&rdquo;
                  </p>
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-sm font-semibold text-foreground">
                      {name}
                    </p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────── */}
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

            <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "relative rounded-2xl border p-6 shadow-[var(--lux-shadow-soft)] transition-all duration-200 sm:p-8",
                    plan.highlight
                      ? "border-primary bg-card ring-1 ring-primary/30 shadow-[var(--lux-shadow-hover)]"
                      : "border-border bg-card"
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
                        ? "shadow-[var(--lux-shadow-soft)]"
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

        {/* ── Final CTA ────────────────────────────────────────── */}
        <section className="border-t border-border bg-muted/30 py-16 sm:py-24">
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
                  "h-13 min-w-[16rem] rounded-xl px-8 text-base shadow-[var(--lux-shadow-hover)]"
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
    </div>
  );
}
