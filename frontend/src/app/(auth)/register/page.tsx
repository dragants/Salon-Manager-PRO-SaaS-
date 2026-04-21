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
      await api.post("/auth/register", {
        email,
        password,
        organization_name: organizationName,
      });
      syncSessionCookie(true);
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
    <div className="flex min-h-dvh items-center justify-center px-4 py-12 sm:px-6">
      <SurfaceCard
        padding="none"
        className="w-full max-w-[400px] rounded-[var(--lux-radius-xl)] p-8 shadow-[var(--lux-shadow-hover)]"
      >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-[length:var(--lux-text-small)]">
            <Link
              href="/landing"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              ← Početna stranica
            </Link>
          </p>
          <h1 className="font-heading text-[length:var(--lux-text-h1)] font-medium tracking-tight text-foreground">
            Registracija
          </h1>
          <p className="text-[length:var(--lux-text-body)] text-muted-foreground">
            Kreiraj nalog za salon lepote, masažu ili wellness i administratora.
            Lozinka min. 8 karaktera.
          </p>
        </div>

        <div className="space-y-4">
          {error ? (
            <p className="rounded-[var(--lux-radius-md)] border border-destructive/35 bg-destructive/10 px-3 py-2 text-[length:var(--lux-text-body)] text-destructive">
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

        <div className="flex flex-col gap-3 border-t border-border pt-2">
          <Button
            type="submit"
            variant="default"
            className="h-11 w-full shadow-[var(--lux-shadow-soft)]"
            disabled={loading}
          >
            {loading ? "Šaljem…" : "Napravi nalog"}
          </Button>
          <p className="text-center text-[length:var(--lux-text-body)] text-muted-foreground">
            Već imaš nalog?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-2 hover:underline"
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
