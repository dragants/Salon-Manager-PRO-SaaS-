import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsCard } from "./SettingsCard";

type CalendarTabProps = {
  saving: boolean;
  minGap: number;
  setMinGap: (v: number) => void;
  maxClients: number;
  setMaxClients: (v: number) => void;
  bufferBetween: number;
  setBufferBetween: (v: number) => void;
  allowOverlap: boolean;
  setAllowOverlap: (v: boolean) => void;
  onSave: () => void;
};

export function CalendarTab({
  saving,
  minGap,
  setMinGap,
  maxClients,
  setMaxClients,
  bufferBetween,
  setBufferBetween,
  allowOverlap,
  setAllowOverlap,
  onSave,
}: CalendarTabProps) {
  return (
    <div className="space-y-6">
      <SettingsCard
        title="Pravila kalendara"
        description={
          "Kalendar \u0107e ova pravila postepeno primenjivati pri zakazivanju i proveri preklapanja."
        }
      >
        <div className="grid max-w-lg gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="min-gap">Min. razmak između početaka (min)</Label>
            <Input
              id="min-gap"
              type="number"
              min={0}
              max={240}
              value={minGap}
              onChange={(e) =>
                setMinGap(Number.parseInt(e.target.value, 10) || 0)
              }
              className="border-border bg-card"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-cli">Maks. klijenata / sat</Label>
            <Input
              id="max-cli"
              type="number"
              min={1}
              max={99}
              value={maxClients}
              onChange={(e) =>
                setMaxClients(Number.parseInt(e.target.value, 10) || 1)
              }
              className="border-border bg-card"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="buf-bet">Buffer između termina (min)</Label>
            <Input
              id="buf-bet"
              type="number"
              min={0}
              max={120}
              value={bufferBetween}
              onChange={(e) =>
                setBufferBetween(Number.parseInt(e.target.value, 10) || 0)
              }
              className="border-border bg-card"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground sm:col-span-2">
            <input
              type="checkbox"
              checked={allowOverlap}
              onChange={(e) => setAllowOverlap(e.target.checked)}
              className="rounded border-border"
            />
            Dozvoli preklapanje termina (više stolica / radnika)
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
          {saving ? "Čuvam…" : "Sačuvaj pravila"}
        </Button>
      </div>
    </div>
  );
}
