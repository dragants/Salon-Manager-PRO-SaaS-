"use client";

import { appointmentStaffLabel } from "@/components/features/calendar/calendar-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDt } from "@/lib/clients-page-utils";
import type { ClientChartEntry, ClientDetail } from "@/types/client";

type ClientDetailTabChartProps = {
  detail: ClientDetail;
  kTitle: string;
  kNotes: string;
  kVisitAt: string;
  kApptId: string;
  kFiles: FileList | null;
  kError: string | null;
  kSaving: boolean;
  onKTitle: (v: string) => void;
  onKNotes: (v: string) => void;
  onKVisitAt: (v: string) => void;
  onKApptId: (v: string) => void;
  onKFiles: (files: FileList | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDownloadFile: (entry: ClientChartEntry, fileId: number) => void;
};

export function ClientDetailTabChart({
  detail,
  kTitle,
  kNotes,
  kVisitAt,
  kApptId,
  kFiles,
  kError,
  kSaving,
  onKTitle,
  onKNotes,
  onKVisitAt,
  onKApptId,
  onKFiles,
  onSubmit,
  onDownloadFile,
}: ClientDetailTabChartProps) {
  return (
    <div className="space-y-6 py-2">
      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl border border-border/90 bg-card p-4"
      >
        <h3 className="font-heading text-sm font-semibold text-foreground">
          Nov unos u karton
        </h3>
        {kError ? (
          <p className="text-sm text-red-700 dark:text-red-300">{kError}</p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="kv-date">Datum / vreme posete</Label>
            <Input
              id="kv-date"
              type="datetime-local"
              value={kVisitAt}
              onChange={(e) => onKVisitAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kv-appt">Poveži sa terminom (ID)</Label>
            <select
              id="kv-appt"
              value={kApptId}
              onChange={(e) => onKApptId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              <option value="">— bez veze —</option>
              {detail.appointments.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  #{a.id} · {formatDt(a.date)} · {a.service_name}
                  {appointmentStaffLabel(a)
                    ? ` · ${appointmentStaffLabel(a)}`
                    : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="kv-title">Naslov / tretman</Label>
          <Input
            id="kv-title"
            value={kTitle}
            onChange={(e) => onKTitle(e.target.value)}
            placeholder="npr. Tretman lica"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kv-notes">Beleška, rezultat</Label>
          <textarea
            id="kv-notes"
            value={kNotes}
            onChange={(e) => onKNotes(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            placeholder="Šta je urađeno, napomene posle tretmana…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kv-files">
            Prilozi (slike, PDF — max 5 × 5 MB)
          </Label>
          <Input
            id="kv-files"
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={(e) => onKFiles(e.target.files)}
          />
        </div>
        <Button type="submit" disabled={kSaving}>
          {kSaving ? "Čuvam…" : "Dodaj u karton"}
        </Button>
      </form>

      <div>
        <h3 className="font-heading mb-2 text-sm font-semibold text-foreground">
          Istorija kartona
        </h3>
        {detail.chart_entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Još nema unosa u karton.</p>
        ) : (
          <ul className="space-y-3">
            {detail.chart_entries.map((e) => (
              <li
                key={e.id}
                className="rounded-xl border border-border/90 bg-muted/60 p-3 text-sm dark:bg-card/40"
              >
                <div className="font-medium text-foreground">
                  {e.title || "Bez naslova"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDt(e.visit_at)}
                  {e.appointment_id ? ` · termin #${e.appointment_id}` : ""}
                </div>
                {e.notes ? (
                  <p className="mt-2 whitespace-pre-wrap text-foreground">
                    {e.notes}
                  </p>
                ) : null}
                {e.attachments?.length ? (
                  <ul className="mt-2 space-y-1">
                    {e.attachments.map((f) => (
                      <li key={f.id}>
                        <button
                          type="button"
                          className="text-left text-foreground underline hover:text-foreground"
                          onClick={() => void onDownloadFile(e, f.id)}
                        >
                          {f.original_name} (
                          {Math.round(f.size_bytes / 1024)} KB)
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
