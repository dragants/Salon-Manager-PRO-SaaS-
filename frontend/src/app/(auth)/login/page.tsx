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

const HERO_SRC =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
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
    } else if (reason === "password_reset_ok") {
      setInfo("Lozinka je uspešno resetovana. Prijavi se novom lozinkom.");
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
      setToken(data.token, rememberMe);
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
    <div className="grid min-h-dvh w-full lg:grid-cols-2">
      <div className="relative hidden min-h-0 lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element -- spoljašnji hero bez remotePatterns u next.config */}
        <img
          src={HERO_SRC}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="font-heading text-3xl font-medium leading-tight tracking-tight">
            Salon Manager PRO
          </p>
          <p className="mt-2 max-w-md text-sm text-white/85">
            Kalendar, klijenti i finansije — jedan miran pregled celog salona.
          </p>
        </div>
      </div>

      <div className="flex min-h-dvh items-center justify-center px-4 py-12 sm:px-8">
        <SurfaceCard padding="lg" className="w-full max-w-md shadow-xl">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2 text-center sm:text-left">
              <p className="text-xs">
                <Link
                  href="/landing"
                  className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
                >
                  ← Početna stranica
                </Link>
              </p>
              <h1 className="font-heading text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-50">
                Prijava
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Email i lozinka — brz ulaz u sistem.
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
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password">Lozinka</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
                  >
                    Zaboravljena lozinka?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-slate-300"
                />
                Zapamti me na ovom uređaju
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-2 dark:border-slate-800">
              <Button
                type="submit"
                variant="brand"
                className="h-11 w-full rounded-xl shadow-md"
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
      </div>
    </div>
  );
}
