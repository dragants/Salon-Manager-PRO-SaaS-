import { Button } from "@/components/ui/button";
import {
  WorkingHoursEditor,
  type DayScheduleRow,
} from "@/components/settings/working-hours-editor";
import { SettingsCard } from "./SettingsCard";

type WorkingHoursTabProps = {
  saving: boolean;
  dayRows: DayScheduleRow[];
  setDayRows: (rows: DayScheduleRow[]) => void;
  onSave: () => void;
};

export function WorkingHoursTab({
  saving,
  dayRows,
  setDayRows,
  onSave,
}: WorkingHoursTabProps) {
  return (
    <div className="space-y-6">
      <SettingsCard
        title="Radno vreme salona"
        description="Uključite dan, interval rada i opcionu pauzu. Podaci se čuvaju struktuirano u bazi."
      >
        <WorkingHoursEditor value={dayRows} onChange={setDayRows} />
      </SettingsCard>
      <div className="flex justify-end border-t border-zinc-100 pt-4">
        <Button
          type="button"
          className="bg-zinc-900 text-white hover:bg-zinc-800"
          disabled={saving}
          onClick={onSave}
        >
          {saving ? "Čuvam…" : "Sačuvaj radno vreme"}
        </Button>
      </div>
    </div>
  );
}
