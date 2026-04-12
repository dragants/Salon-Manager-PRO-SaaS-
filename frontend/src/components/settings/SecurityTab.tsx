import { Button } from "@/components/ui/button";
import { AuditLogPanel } from "./AuditLogPanel";
import { SettingsCard } from "./SettingsCard";

type SecurityTabProps = {
  workerCanDelete: boolean;
  onWorkerCanDeleteChange: (value: boolean) => void;
  saving: boolean;
  onSaveWorkerPermissions: () => void;
};

export function SecurityTab({
  workerCanDelete,
  onWorkerCanDeleteChange,
  saving,
  onSaveWorkerPermissions,
}: SecurityTabProps) {
  return (
    <div className="space-y-6">
      <SettingsCard
        title="Dozvole radnika"
        description="Podrazumevano radnik ne može da briše zapise. Uključi samo ako poveravaš članu tima."
      >
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200/90 bg-white p-4">
          <input
            type="checkbox"
            className="mt-1 size-4 rounded border-zinc-300 text-zinc-900"
            checked={workerCanDelete}
            onChange={(e) => onWorkerCanDeleteChange(e.target.checked)}
          />
          <span className="text-sm leading-relaxed text-zinc-800">
            <span className="font-medium text-zinc-900">
              Radnik može brisati klijente i zakazane termine
            </span>
            <span className="mt-1 block text-zinc-600">
              Isključeno: dugmad za brisanje se ne prikazuju i API vraća grešku.
              Administrator uvek može da briše.
            </span>
          </span>
        </label>
        <div className="mt-4">
          <Button
            type="button"
            className="bg-zinc-900 text-white hover:bg-zinc-800"
            disabled={saving}
            onClick={onSaveWorkerPermissions}
          >
            {saving ? "Čuvam…" : "Sačuvaj dozvole"}
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Sigurnost naloga"
        description="Kontrola pristupa i sesija."
      >
        <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-zinc-600">
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
