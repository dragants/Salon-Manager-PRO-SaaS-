import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SettingsCard } from "./SettingsCard";

type FinanceTabProps = {
  saving: boolean;
  currency: string;
  setCurrency: (v: string) => void;
  vatEnabled: boolean;
  setVatEnabled: (v: boolean) => void;
  acceptCash: boolean;
  setAcceptCash: (v: boolean) => void;
  acceptCard: boolean;
  setAcceptCard: (v: boolean) => void;
  onSave: () => void;
};

export function FinanceTab({
  saving,
  currency,
  setCurrency,
  vatEnabled,
  setVatEnabled,
  acceptCash,
  setAcceptCash,
  acceptCard,
  setAcceptCard,
  onSave,
}: FinanceTabProps) {
  return (
    <div className="space-y-6">
      <SettingsCard
        title="Finansije"
        description="Valuta i način naplate. Dnevni izveštaj blagajne dolazi uz modul finansija."
      >
        <div className="grid max-w-md gap-4">
          <div className="space-y-2">
            <Label htmlFor="cur">Valuta</Label>
            <select
              id="cur"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="RSD">RSD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={vatEnabled}
              onChange={(e) => setVatEnabled(e.target.checked)}
              className="rounded border-border"
            />
            PDV (prikaz / obračun u toku razvoja)
          </label>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            Način naplate
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={acceptCash}
              onChange={(e) => setAcceptCash(e.target.checked)}
              className="rounded border-border"
            />
            Gotovina
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={acceptCard}
              onChange={(e) => setAcceptCard(e.target.checked)}
              className="rounded border-border"
            />
            Kartica
          </label>
        </div>
      </SettingsCard>
      <div className="flex justify-end border-t border-border/50 pt-4">
        <Button
          type="button"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={saving}
          onClick={onSave}
        >
          {saving ? "Čuvam…" : "Sačuvaj finansije"}
        </Button>
      </div>
    </div>
  );
}
