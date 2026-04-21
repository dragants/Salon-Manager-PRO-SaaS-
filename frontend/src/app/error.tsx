"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      id="main-content"
      className="flex min-h-[50vh] flex-col items-center justify-center bg-[#f8fafc] px-4 py-12"
    >
      <SurfaceCard padding="lg" className="max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          <AlertTriangle className="size-6" aria-hidden />
        </div>
        <h1 className="text-lg font-semibold text-foreground ">
          Nešto nije u redu
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aplikacija je naišla na grešku. Možeš pokušati ponovo ili se vratiti
          na početak.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-[10px] text-muted-foreground/70">
            {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="brand"
            className="rounded-xl"
            onClick={() => reset()}
          >
            Pokušaj ponovo
          </Button>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex rounded-xl no-underline"
            )}
          >
            Dashboard
          </Link>
        </div>
      </SurfaceCard>
    </div>
  );
}
