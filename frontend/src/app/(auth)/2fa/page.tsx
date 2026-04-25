"use client";

import { useEffect, useMemo, useState } from "react";
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

type SetupResponse = {
  otpauth_url: string;
  secret: string;
  qr: string;
  mfa_enforced: boolean;
};

export default function TwoFaSetupPage() {
  const router = useRouter();
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [otp, setOtp] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maskedSecret = useMemo(() => {
    const s = setup?.secret ?? "";
    if (!s) return "";
    if (s.length <= 8) return s;
    return `${s.slice(0, 4)}…${s.slice(-4)}`;
  }, [setup?.secret]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.post<SetupResponse>("/auth/2fa/setup");
        if (!cancelled) setSetup(data);
      } catch (e) {
        if (cancelled) return;
        if (axios.isAxiosError(e) && e.response?.status === 409) {
          setError(
            "2FA je već uključena za ovaj nalog. Idi na prijavu i unesi 2FA kod iz Authenticator aplikacije."
          );
          // Izbegni "loop" na /2fa kada je već uključeno: pošalji na login.
          window.setTimeout(() => {
            if (!cancelled) {
              router.replace("/login?reason=2fa_enabled");
              router.refresh();
            }
          }, 400);
          return;
        }
        setError(getApiErrorMessage(e, "Ne mogu da pokrenem 2FA setup."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable2fa(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleaned = otp.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(cleaned)) {
      setError(
        "Unesi 6-cifreni kod iz Authenticator aplikacije (ne secret)."
      );
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post<{ ok: true; backup_codes: string[] }>(
        "/auth/2fa/enable",
        { otp: cleaned }
      );
      setBackupCodes(data.backup_codes);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        setError("Neispravan kod. Proveri vreme na telefonu i pokušaj ponovo.");
      } else {
        setError(getApiErrorMessage(err, "Ne mogu da uključim 2FA."));
      }
    } finally {
      setSaving(false);
    }
  }

  function goToApp() {
    syncSessionCookie(true);
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12 sm:px-8">
      <SurfaceCard
        padding="none"
        className="w-full max-w-[560px] rounded-[var(--smp-radius-xl)] p-8 shadow-[var(--smp-shadow-hover)]"
      >
        <div className="space-y-2">
          <p className="text-[length:var(--smp-text-small)]">
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              ← Nazad na prijavu
            </Link>
          </p>
          <h1 className="font-heading text-[length:var(--smp-text-h1)] font-medium tracking-tight text-foreground">
            Uključi 2FA
          </h1>
          <p className="text-[length:var(--smp-text-body)] text-muted-foreground">
            Za administratorske naloge 2FA je obavezna. Skeniraj QR kod u Google
            Authenticator / Authy i unesi kod.
          </p>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Učitavanje…</p>
        ) : null}

        {error ? (
          <div className="mt-6 space-y-3 rounded-[var(--smp-radius-md)] border border-destructive/35 bg-destructive/10 px-3 py-3 text-[length:var(--smp-text-body)] text-destructive">
            <p>{error}</p>
            {error.toLowerCase().includes("već uključena") ? (
              <Button
                type="button"
                variant="outline"
                className="border-destructive/35 bg-transparent text-destructive hover:bg-destructive/10"
                onClick={() => router.replace("/login")}
              >
                Idi na prijavu
              </Button>
            ) : null}
          </div>
        ) : null}

        {!loading && setup ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-card p-4">
                <p className="text-sm font-medium text-foreground">QR kod</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={setup.qr}
                  alt="2FA QR kod"
                  className="mt-3 w-full max-w-[220px] rounded bg-white p-2"
                />
              </div>
              <div className="rounded-lg border border-border/70 bg-card p-4">
                <p className="text-sm font-medium text-foreground">
                  Ručni unos (secret)
                </p>
                <p className="mt-3 font-mono text-sm text-muted-foreground">
                  {setup.secret}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  (skraćeno: {maskedSecret})
                </p>
              </div>
            </div>

            {backupCodes ? (
              <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/70 p-4 text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
                <p className="text-sm font-medium">
                  2FA je uključena. Sačuvaj backup kodove.
                </p>
                <ul className="mt-3 grid gap-2 font-mono text-sm sm:grid-cols-2">
                  {backupCodes.map((c) => (
                    <li
                      key={c}
                      className="rounded border border-emerald-200/60 bg-white/70 px-2 py-1 dark:border-emerald-900/40 dark:bg-black/20"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Button type="button" onClick={goToApp}>
                    Nastavi u aplikaciju
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={enable2fa} className="space-y-3">
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
                  <p className="text-xs text-muted-foreground">
                    Unosi se 6-cifreni TOTP kod (menja se na ~30s).{" "}
                    <strong>Ne unosi secret</strong>.
                  </p>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Uključujem…" : "Uključi 2FA"}
                </Button>
              </form>
            )}
          </div>
        ) : null}
      </SurfaceCard>
    </div>
  );
}

