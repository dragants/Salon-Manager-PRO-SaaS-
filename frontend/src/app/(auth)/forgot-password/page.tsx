"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requestPasswordReset } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setError(
          "Nema veze sa serverom. Proveri backend i NEXT_PUBLIC_API_URL."
        );
      } else {
        setError(getApiErrorMessage(err, "Zahtev nije poslat."));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-sky-50/50 to-background px-4 py-12 dark:from-slate-900 sm:px-6">
      <SurfaceCard padding="lg" className="w-full max-w-md shadow-lg">
        {sent ? (
          <div className="space-y-4 text-center sm:text-left">
            <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground ">
              Proveri e-poštu
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ako nalog postoji za tu adresu, poslali smo uputstvo za reset
              lozinke. Link važi oko jednog sata. Proveri i folder „Spam“.
            </p>
            <p className="text-xs text-muted-foreground">
              Bez podešenog APP_SMTP_* na serveru, link se u razvoju može videti
              u konzoli backend-a.
            </p>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "inline-flex h-11 w-full items-center justify-center no-underline"
              )}
            >
              Nazad na prijavu
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2 text-center sm:text-left">
              <p className="text-xs">
                <Link
                  href="/login"
                  className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
                >
                  ← Nazad na prijavu
                </Link>
              </p>
              <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground ">
                Zaboravljena lozinka
              </h1>
              <p className="text-sm text-muted-foreground">
                Unesi e-adresu naloga — poslaćemo link za novu lozinku.
              </p>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
                {error}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="fp-email">Email</Label>
              <Input
                id="fp-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="brand"
              className="h-11 w-full rounded-xl shadow-md"
              disabled={loading}
            >
              {loading ? "Šaljem…" : "Pošalji link"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Administrator tima i dalje može menjati lozinke u{" "}
              <Link
                href="/settings"
                className="font-medium text-sky-700 underline dark:text-sky-400"
              >
                Podešavanjima → Tim
              </Link>
              .
            </p>
          </form>
        )}
      </SurfaceCard>
    </div>
  );
}
