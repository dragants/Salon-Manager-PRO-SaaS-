import Link from "next/link";
import { Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-3.5" aria-hidden />
              </div>
              <span className="font-heading text-base font-bold tracking-tight text-foreground">
                Salon Manager{" "}
                <span className="text-primary">PRO</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Kalendar, klijenti, online rezervacije i finansije za salone lepote i wellness.
            </p>
          </div>

          {/* Product links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Proizvod
            </p>
            <nav className="mt-3 flex flex-col gap-2" aria-label="Linkovi proizvoda">
              <Link
                href="#funkcije"
                className="text-sm text-foreground/80 transition hover:text-primary"
              >
                Funkcije
              </Link>
              <Link
                href="#cene"
                className="text-sm text-foreground/80 transition hover:text-primary"
              >
                Cene
              </Link>
              <Link
                href="/register"
                className="text-sm text-foreground/80 transition hover:text-primary"
              >
                Registracija
              </Link>
              <Link
                href="/login"
                className="text-sm text-foreground/80 transition hover:text-primary"
              >
                Prijava
              </Link>
            </nav>
          </div>

          {/* Legal links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Pravno
            </p>
            <nav className="mt-3 flex flex-col gap-2" aria-label="Pravne informacije">
              <Link
                href="/legal/terms"
                className="text-sm text-foreground/80 transition hover:text-primary"
              >
                Uslovi korišćenja
              </Link>
              <Link
                href="/legal/privacy"
                className="text-sm text-foreground/80 transition hover:text-primary"
              >
                Politika privatnosti
              </Link>
              <Link
                href="/legal/billing"
                className="text-sm text-foreground/80 transition hover:text-primary"
              >
                Pretplata i naplata
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Podrška
            </p>
            <nav className="mt-3 flex flex-col gap-2" aria-label="Podrška">
              <Link
                href="#faq"
                className="text-sm text-foreground/80 transition hover:text-primary"
              >
                Česta pitanja
              </Link>
              <a
                href="mailto:podrska@salonmanagerpro.com"
                className="text-sm text-foreground/80 transition hover:text-primary"
              >
                Kontakt
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center gap-2 border-t border-border pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Dragan Saric. Sva prava zadržana.
          </p>
          <p className="text-xs text-muted-foreground">
            Napravljeno u Srbiji
          </p>
        </div>
      </div>
    </footer>
  );
}
