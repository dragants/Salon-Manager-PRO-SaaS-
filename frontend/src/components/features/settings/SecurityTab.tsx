import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale";
import { useAuth } from "@/providers/auth-provider";
import { AuditLogPanel } from "./AuditLogPanel";
import { SettingsCard } from "./SettingsCard";

type SecurityTabProps = {
  workerCanDelete: boolean;
  onWorkerCanDeleteChange: (value: boolean) => void;
  saving: boolean;
  onSaveWorkerPermissions: () => void;
  /** Lokalno stanje se razlikuje od servera (pre čuvanja). */
  permissionsDirty?: boolean;
};

export function SecurityTab({
  workerCanDelete,
  onWorkerCanDeleteChange,
  saving,
  onSaveWorkerPermissions,
  permissionsDirty = false,
}: SecurityTabProps) {
  const t = useT();
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const twofaOn = Boolean(user?.twofa_enabled);

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Dozvole radnika"
        description="Podrazumevano radnik ne može da briše zapise. Uključi samo ako poveravaš članu tima."
      >
        {permissionsDirty ? (
          <p className="mb-4 rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100">
            <strong>Nesačuvane izmene</strong> u dozvolama — sačuvaj pre
            napuštanja taba.
          </p>
        ) : null}
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/90 bg-card p-4">
          <input
            type="checkbox"
            className="mt-1 size-4 rounded border-border text-foreground"
            checked={workerCanDelete}
            onChange={(e) => onWorkerCanDeleteChange(e.target.checked)}
          />
          <span className="text-sm leading-relaxed text-foreground">
            <span className="font-medium text-foreground">
              Radnik može brisati klijente i zakazane termine
            </span>
            <span className="mt-1 block text-muted-foreground">
              Isključeno: dugmad za brisanje se ne prikazuju i API vraća grešku.
              Administrator uvek može da briše.
            </span>
          </span>
        </label>
        <div className="mt-4">
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={saving}
            onClick={onSaveWorkerPermissions}
          >
            {saving ? t.common.loading : t.common.save}
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Sigurnost naloga"
        description="Kontrola pristupa i sesija."
      >
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Promena lozinke: bočna traka → <strong>Moj nalog</strong> (važi za
            sve članove tima). Posle promene moraš se ponovo prijaviti na svim
            uređajima.
          </p>
          <div className="rounded-lg border border-border/90 bg-card p-4 text-foreground">
            <p className="font-medium text-foreground">
              Dvofaktorska autentikacija (2FA)
            </p>
            {twofaOn ? (
              <p className="mt-2 text-muted-foreground">
                2FA je <strong className="text-foreground">uključena</strong>.
                Pri prijavi unosiš šestocifreni kod iz Authenticator aplikacije.
              </p>
            ) : (
              <>
                <p className="mt-2 text-muted-foreground">
                  Dodatni sloj zaštite naloga. Otvara se posebna stranica sa QR
                  kodom (moraš biti prijavljen).
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 border-border"
                  onClick={() => router.push("/2fa")}
                >
                  Uključi 2FA (QR kod)
                </Button>
              </>
            )}
          </div>
          <p>
            Odjava: dugme „Odjava“ u bočnoj traci.
          </p>
        </div>
      </SettingsCard>

      <AuditLogPanel />
    </div>
  );
}
