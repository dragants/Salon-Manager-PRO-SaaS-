import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center bg-[#f8fafc] px-4"
    >
      <SurfaceCard padding="lg" className="max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-sky-600 dark:text-sky-400">
          404
        </p>
        <h1 className="mt-2 text-xl font-semibold text-foreground ">
          Stranica nije pronađena
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Proveri adresu ili se vrati na početnu aplikacije.
        </p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "brand" }),
              "no-underline"
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/landing"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-xl border-border no-underline "
            )}
          >
            Početna (marketing)
          </Link>
        </div>
      </SurfaceCard>
    </div>
  );
}
