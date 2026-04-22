"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCw, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center bg-background px-4"
    >
      <div className="mx-auto max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="size-7 text-destructive" aria-hidden />
        </div>

        <h1 className="text-xl font-bold text-foreground">
          Nešto je pošlo po zlu
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Došlo je do neočekivane greške. Pokušajte ponovo ili se
          vratite na Dashboard.
        </p>

        {error.digest ? (
          <p className="mt-3 rounded-lg bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
            Kôd: {error.digest}
          </p>
        ) : null}

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            variant="brand"
            className="gap-2 rounded-xl"
          >
            <RefreshCw className="size-4" aria-hidden />
            Pokušaj ponovo
          </Button>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "gap-2 rounded-xl border-border no-underline"
            )}
          >
            <Home className="size-4" aria-hidden />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
