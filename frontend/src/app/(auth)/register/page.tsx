"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SurfaceCard } from "@/components/ui/surface-card";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { setToken } from "@/lib/auth/token";
import { syncSessionCookie } from "@/lib/auth/session-cookie";
import { useAuth } from "@/providers/auth-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser, user, loading: authLoading } = useAuth();
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      return;
    }
    syncSessionCookie(true);
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("salon_onboarding_pending") === "1"
    ) {
      router.replace("/onboarding");
      return;
    }
    router.replace("/dashboard");
  }, [router, authLoading, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<{ token: string }>("/auth/register", {
        email,
        password,
        organization_name: organizationName,
      });
      setToken(data.token, true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("salon_onboarding_pending", "1");
      }
      await refreshUser();
      router.replace("/onboarding");
      router.refresh();
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setError(
          "Nema veze sa serverom. Proveri da li je backend uključen i NEXT_PUBLIC_API_URL."
        );
      } else {
        setError(getApiErrorMessage(err, "Registracija nije uspela."));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-sky-50/50 to-[#f8fafc] px-4 py-12 dark:from-slate-900 dark:to-slate-950 sm:px-6">
      <SurfaceCard padding="lg" className="w-full max-w-md shadow-lg">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-xs">
            <Link
              href="/landing"
              className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
            >
              ← Početna stranica
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Registracija
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Kreiraj salon i administratorski nalog. Lozinka min. 8 karaktera.
          </p>
        </div>

        <div className="space-y-4">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="org">Ime salona</Label>
            <Input
              id="org"
              autoComplete="organization"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lozinka</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-2 dark:border-slate-800">
          <Button
            type="submit"
            variant="brand"
            className="h-11 w-full"
            disabled={loading}
          >
            {loading ? "Šaljem…" : "Napravi nalog"}
          </Button>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Već imaš nalog?{" "}
            <Link
              href="/login"
              className="font-medium text-sky-700 underline dark:text-sky-400"
            >
              Prijava
            </Link>
          </p>
        </div>
      </form>
    </SurfaceCard>
    </div>
  );
}
