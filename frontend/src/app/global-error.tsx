"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import "./globals.css";

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
    <html lang="sr">
      <body
        id="main-content"
        className="flex min-h-dvh flex-col items-center justify-center bg-[#f8fafc] px-4 antialiased text-foreground"
      >
        <SurfaceCard padding="lg" className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-foreground ">
            Nešto nije u redu
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Došlo je do greške u aplikaciji. Pokušaj ponovo ili osveži stranicu.
          </p>
          {error.digest ? (
            <p className="mt-3 font-mono text-[10px] text-muted-foreground/70">
              {error.digest}
            </p>
          ) : null}
          <Button
            type="button"
            variant="brand"
            className="mt-6 w-full rounded-xl"
            onClick={() => reset()}
          >
            Pokušaj ponovo
          </Button>
        </SurfaceCard>
      </body>
    </html>
  );
}
