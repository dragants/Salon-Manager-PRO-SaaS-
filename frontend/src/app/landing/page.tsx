import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[#f8fafc] dark:bg-slate-950">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Salon Manager <span className="text-sky-600">PRO</span>
          </span>
          <div className="flex gap-2">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-xl border-slate-200 dark:border-slate-600"
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

      <main
        id="main-content"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <SurfaceCard
          padding="lg"
          className="mx-auto max-w-3xl text-center shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)] dark:shadow-none"
        >
          <p className="text-sm font-medium uppercase tracking-wide text-sky-600 dark:text-sky-400">
            SaaS za salone
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
            Upravljajte salonima bez haosa
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Kalendar · Klijenti · Automatski podsetnici · Online rezervacije
          </p>
          <ul className="mx-auto mt-10 max-w-md space-y-3 text-left text-slate-700 dark:text-slate-300">
            <li className="flex gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">✔</span>
              Manje poziva — klijenti vide slobodne termine sami
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">✔</span>
              Nema propuštenih termina — podsetnici i jasna istorija
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">✔</span>
              Veća zarada — pratite prihod i usluge na jednom mestu
            </li>
          </ul>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: "brand", size: "lg" }),
                "h-12 min-w-[14rem] rounded-xl px-8"
              )}
            >
              Isprobaj 7 dana besplatno
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 min-w-[12rem] rounded-xl border-slate-200 dark:border-slate-600"
              )}
            >
              Već imam nalog
            </Link>
          </div>
        </SurfaceCard>
      </main>
    </div>
  );
}
