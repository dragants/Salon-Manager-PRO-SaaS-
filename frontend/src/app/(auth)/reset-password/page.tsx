"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SurfaceCard } from "@/components/ui/surface-card";
import { resetPasswordWithToken } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Lozinka mora imati najmanje 8 karaktera.");
      return;
    }
    if (password !== password2) {
      setError("Lozinke se ne poklapaju.");
      return;
    }
    if (!token) {
      setError("Nedostaje token u linku. Zatražite novi mejl za reset.");
      return;
    }
    setLoading(true);
    try {
      await resetPasswordWithToken(token, password);
      router.replace("/login?reason=password_reset_ok");
      router.refresh();
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setError(
          "Nema veze sa serverom. Proveri backend i NEXT_PUBLIC_API_URL."
        );
      } else {
        setError(
          getApiErrorMessage(
            err,
            "Reset nije uspeo. Link je možda istekao — zatražite novi."
          )
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <SurfaceCard padding="lg" className="w-full max-w-md shadow-lg">
        <div className="space-y-4 text-center sm:text-left">
          <h1 className="font-heading text-2xl font-medium text-foreground ">
            Nevažeći link
          </h1>
          <p className="text-sm text-muted-foreground">
            Otvori ponovo link iz mejla ili zatraži novi reset sa stranice za
            zaboravljenu lozinku.
          </p>
          <Link
            href="/forgot-password"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex h-11 w-full items-center justify-center no-underline"
            )}
          >
            Zatraži novi link
          </Link>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard padding="lg" className="w-full max-w-md shadow-lg">
      <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground ">
              Nova lozinka
            </h1>
            <p className="text-sm text-muted-foreground">
              Unesi novu lozinku (min. 8 karaktera).
            </p>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="np1">Nova lozinka</Label>
            <Input
              id="np1"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="np2">Ponovi lozinku</Label>
            <Input
              id="np2"
              type="password"
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button
            type="submit"
            variant="brand"
            className="h-11 w-full rounded-xl shadow-md"
            disabled={loading}
          >
            {loading ? "Čuvam…" : "Sačuvaj lozinku"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-sky-700 underline dark:text-sky-400"
            >
              Nazad na prijavu
            </Link>
          </p>
        </form>
    </SurfaceCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-sky-50/50 to-background px-4 py-12 dark:from-slate-900 sm:px-6">
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">
            Učitavanje…
          </p>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
