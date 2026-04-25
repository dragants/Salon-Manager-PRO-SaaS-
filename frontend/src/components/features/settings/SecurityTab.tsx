import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale";
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
        <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            Promena lozinke: bočna traka → <strong>Moj nalog</strong> (važi za
            sve članove tima). Posle promene moraš se ponovo prijaviti na svim
            uređajima.
          </li>
          <li>Dvofaktorska autentikacija (2FA) — kasnije.</li>
          <li>
            Trenutno se odjavljujete preko dugmeta „Odjava“ u bočnoj traci.
          </li>
        </ul>
      </SettingsCard>

      <AuditLogPanel />
    </div>
  );
}
