"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { api } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import { syncSessionCookie } from "@/lib/auth/session-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SurfaceCard } from "@/components/ui/surface-card";

export default function MfaVerifyPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // If user is here after a redirect, keep it simple.
    document.title = "2FA potvrda";
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleaned = otp.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(cleaned)) {
      setError("Unesi 6-cifreni kod iz Google Authenticator aplikacije.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/auth/2fa/verify", { otp: cleaned });
      syncSessionCookie(true);
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        setError("Neispravan kod. Sačekaj novi kod i pokušaj ponovo.");
      } else {
        setError(getApiErrorMessage(err, "Ne mogu da potvrdim 2FA."));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12 sm:px-8">
      <SurfaceCard
        padding="none"
        className="w-full max-w-[520px] rounded-[var(--smp-radius-xl)] p-8 shadow-[var(--smp-shadow-hover)]"
      >
        <div className="space-y-2">
          <p className="text-[length:var(--smp-text-small)]">
            <Link
              href="/dashboard"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              ← Nazad u aplikaciju
            </Link>
          </p>
          <h1 className="font-heading text-[length:var(--smp-text-h1)] font-medium tracking-tight text-foreground">
            Potvrdi 2FA
          </h1>
          <p className="text-[length:var(--smp-text-body)] text-muted-foreground">
            Ova radnja zahteva dodatnu potvrdu. Unesi 6-cifreni kod iz Google
            Authenticator aplikacije.
          </p>
        </div>

        {error ? (
          <p className="mt-6 rounded-[var(--smp-radius-md)] border border-destructive/35 bg-destructive/10 px-3 py-2 text-[length:var(--smp-text-body)] text-destructive">
            {error}
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="otp">Kod iz aplikacije</Label>
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Proveravam…" : "Potvrdi"}
          </Button>
        </form>
      </SurfaceCard>
    </div>
  );
}

