"use client";
export type DayId =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

export type DayScheduleRow = {
  id: DayId;
  label: string;
  enabled: boolean;
  open: string;
  close: string;
  breakStart: string;
  breakEnd: string;
};

export const DAY_DEFINITIONS: { id: DayId; label: string }[] = [
  { id: "mon", label: "Ponedeljak" },
  { id: "tue", label: "Utorak" },
  { id: "wed", label: "Sreda" },
  { id: "thu", label: "Četvrtak" },
  { id: "fri", label: "Petak" },
  { id: "sat", label: "Subota" },
  { id: "sun", label: "Nedelja" },
];

function weekdayDefaultEnabled(id: DayId): boolean {
  return id !== "sat" && id !== "sun";
}

function readDay(
  id: DayId,
  label: string,
  raw: Record<string, unknown> | undefined
): DayScheduleRow {
  const defEn = weekdayDefaultEnabled(id);
  const v =
    raw != null && typeof raw === "object" && !Array.isArray(raw)
      ? raw[id]
      : undefined;
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    return {
      id,
      label,
      enabled: defEn,
      open: "09:00",
      close: "17:00",
      breakStart: "",
      breakEnd: "",
    };
  }
  const o = v as Record<string, unknown>;
  const hasTimes =
    typeof o.open === "string" || typeof o.close === "string";
  const enabled =
    o.enabled === false
      ? false
      : o.enabled === true
        ? true
        : Boolean(hasTimes) || defEn;
  const open = typeof o.open === "string" ? o.open : "09:00";
  const close = typeof o.close === "string" ? o.close : "17:00";
  const breakStart =
    typeof o.break_start === "string" ? o.break_start : "";
  const breakEnd = typeof o.break_end === "string" ? o.break_end : "";
  return { id, label, enabled, open, close, breakStart, breakEnd };
}

function normalizeWorkingHoursRoot(
  raw: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }
  const schedule = raw.schedule;
  if (
    schedule != null &&
    typeof schedule === "object" &&
    !Array.isArray(schedule)
  ) {
    return schedule as Record<string, unknown>;
  }
  const days = raw.days;
  if (days != null && typeof days === "object" && !Array.isArray(days)) {
    return days as Record<string, unknown>;
  }
  return raw;
}

export function parseWorkingHoursFromApi(
  raw: Record<string, unknown> | undefined
): DayScheduleRow[] {
  const root = normalizeWorkingHoursRoot(raw);
  return DAY_DEFINITIONS.map(({ id, label }) => readDay(id, label, root));
}

/** Kratki tekst za dashboard (bez JSON-a). */
export function formatWorkingHoursBrief(
  raw: Record<string, unknown> | null | undefined
): string {
  if (!raw || Object.keys(raw).length === 0) {
    return "Još nije podešeno — uredi u Podešavanjima.";
  }

  const rows = parseWorkingHoursFromApi(raw);
  const active = rows.filter((r) => r.enabled);
  if (active.length === 0) {
    return "Nema uključenih radnih dana.";
  }

  const first = active[0];
  const sameHours =
    first &&
    active.every(
      (r) =>
        r.open === first.open &&
        r.close === first.close &&
        r.breakStart === first.breakStart &&
        r.breakEnd === first.breakEnd
    );

  const order = DAY_DEFINITIONS.map((d) => d.id);
  const indices = active.map((r) => order.indexOf(r.id)).sort((a, b) => a - b);
  const contiguous =
    indices.length > 0 &&
    indices.every((ix, i) => i === 0 || ix === indices[i - 1]! + 1);

  if (sameHours && contiguous && active.length >= 2 && first) {
    const a = active[0];
    const b = active[active.length - 1];
    return `${a.label}–${b.label}: ${a.open}–${a.close}`;
  }

  if (active.length === 1 && first) {
    return `${first.label}: ${first.open}–${first.close}`;
  }

  return active
    .map((r) => `${r.label.slice(0, 3)}. ${r.open}–${r.close}`)
    .join(" · ");
}

export function workingHoursToPayload(
  rows: DayScheduleRow[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const d of rows) {
    if (!d.enabled) {
      out[d.id] = { enabled: false };
      continue;
    }
    const chunk: Record<string, unknown> = {
      enabled: true,
      open: d.open,
      close: d.close,
    };
    if (d.breakStart.trim() && d.breakEnd.trim()) {
      chunk.break_start = d.breakStart.trim();
      chunk.break_end = d.breakEnd.trim();
    }
    out[d.id] = chunk;
  }
  return out;
}

type WorkingHoursEditorProps = {
  value: DayScheduleRow[];
  onChange: (next: DayScheduleRow[]) => void;
};

export function WorkingHoursEditor({
  value,
  onChange,
}: WorkingHoursEditorProps) {
  function patchRow(id: DayId, patch: Partial<DayScheduleRow>) {
    onChange(
      value.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }

  return (
    <div className="space-y-3">
      {value.map((row) => (
        <div
          key={row.id}
          className="rounded-lg border border-border/90 bg-muted/60 px-3 py-3 sm:px-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={(e) =>
                  patchRow(row.id, { enabled: e.target.checked })
                }
                className="rounded border-border"
              />
              {row.label}
            </label>
            {row.enabled ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">otvaranje</span>
                <input
                  type="time"
                  value={row.open}
                  onChange={(e) =>
                    patchRow(row.id, { open: e.target.value })
                  }
                  className="rounded-md border border-border bg-card px-2 py-1 font-mono text-foreground"
                />
                <span className="text-muted-foreground">—</span>
                <input
                  type="time"
                  value={row.close}
                  onChange={(e) =>
                    patchRow(row.id, { close: e.target.value })
                  }
                  className="rounded-md border border-border bg-card px-2 py-1 font-mono text-foreground"
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Ne radite ovog dana</p>
            )}
          </div>
          {row.enabled ? (
            <div className="mt-3 flex flex-col gap-2 border-t border-border/80 pt-3 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pauza
              </span>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <input
                  type="time"
                  value={row.breakStart}
                  onChange={(e) =>
                    patchRow(row.id, { breakStart: e.target.value })
                  }
                  className="rounded-md border border-border bg-card px-2 py-1 font-mono text-foreground"
                  aria-label={`${row.label} početak pauze`}
                />
                <span className="text-muted-foreground/70">do</span>
                <input
                  type="time"
                  value={row.breakEnd}
                  onChange={(e) =>
                    patchRow(row.id, { breakEnd: e.target.value })
                  }
                  className="rounded-md border border-border bg-card px-2 py-1 font-mono text-foreground"
                  aria-label={`${row.label} kraj pauze`}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Ostavi prazno ako nema pauze u smeni.
              </p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
