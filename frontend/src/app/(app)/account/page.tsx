"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { changeMyPassword } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { PushNotificationsCard } from "@/components/features/account/push-notifications-card";
import { clearToken } from "@/lib/auth/token";
import { useAuth } from "@/providers/auth-provider";

export default function AccountPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!current || !next) {
      setError("Popuni sva polja.");
      return;
    }
    if (next.length < 8) {
      setError("Nova lozinka: min. 8 karaktera.");
      return;
    }
    if (next !== confirm) {
      setError("Potvrda nove lozinke se ne poklapa.");
      return;
    }
    if (current === next) {
      setError("Nova lozinka mora se razlikovati od trenutne.");
      return;
    }
    setSaving(true);
    try {
      await changeMyPassword({
        current_password: current,
        new_password: next,
      });
      clearToken();
      await refreshUser();
      router.replace("/login?reason=password_changed");
    } catch (err) {
      setError(getApiErrorMessage(err, "Lozinka nije promenjena."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <SectionHeader
        title="Moj nalog"
        description={
          <>
            <span className="block text-slate-600 dark:text-slate-400">
              {user?.email ?? "—"}
            </span>
            <span className="mt-2 block">
              Promena lozinke za tvoj nalog.
            </span>
          </>
        }
      />

      <PushNotificationsCard />

      <SurfaceCard padding="md">
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Promena lozinke
          </h2>
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="pw-current">Trenutna lozinka</Label>
            <Input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw-new">Nova lozinka</Label>
            <Input
              id="pw-new"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw-confirm">Potvrdi novu lozinku</Label>
            <Input
              id="pw-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
            />
          </div>
          <Button type="submit" variant="brand" disabled={saving}>
            {saving ? "Čuvam…" : "Sačuvaj novu lozinku"}
          </Button>
        </form>
      </SurfaceCard>
    </div>
  );
}
