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

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const reason = new URLSearchParams(window.location.search).get("reason");
    if (reason === "password_changed") {
      setInfo("Lozinka je promenjena. Prijavi se ponovo.");
    } else if (reason === "session_revoked") {
      setInfo("Sesija više nije važeća. Prijavi se ponovo.");
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user) {
      syncSessionCookie(true);
      router.replace("/dashboard");
    }
  }, [router, authLoading, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<{ token: string }>("/auth/login", {
        email,
        password,
      });
      setToken(data.token);
      await refreshUser();
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setError(
          "Nema veze sa serverom. Proveri da li je backend uključen i NEXT_PUBLIC_API_URL."
        );
      } else {
        setError(getApiErrorMessage(err, "Prijava nije uspela."));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SurfaceCard padding="lg" className="w-full">
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
            Prijava
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Email i lozinka (Google uskoro).
          </p>
        </div>

        <div className="space-y-4">
          {info ? (
            <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-100">
              {info}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
              {error}
            </p>
          ) : null}
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            {loading ? "Šaljem…" : "Prijavi se"}
          </Button>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Nemaš nalog?{" "}
            <Link
              href="/register"
              className="font-medium text-sky-700 underline dark:text-sky-400"
            >
              Registracija
            </Link>
          </p>
        </div>
      </form>
    </SurfaceCard>
  );
}
