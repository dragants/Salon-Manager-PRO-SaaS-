"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Mora biti “tanak”: bez Button/SurfaceCard — Base UI / slot koristi kontekst koji
 * pri statičkom prerenderu `/_global-error` puca (useContext null).
 */
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
      <body className="min-h-dvh bg-background px-4 py-10 font-sans text-foreground antialiased">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
          <h1 className="text-lg font-semibold text-foreground">
            Nešto nije u redu
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Došlo je do greške u aplikaciji. Pokušaj ponovo ili osveži stranicu.
          </p>
          {error.digest ? (
            <p className="mt-3 font-mono text-[10px] text-muted-foreground/80">
              {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            className="mt-6 w-full cursor-pointer rounded-xl border border-transparent bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 active:scale-[0.99]"
            onClick={() => reset()}
          >
            Pokušaj ponovo
          </button>
        </div>
      </body>
    </html>
  );
}
