import { cn } from "@/lib/utils";

const items = [
  { label: "Z", desc: "Zakazano", className: "bg-amber-500" },
  { label: "V", desc: "Završeno", className: "bg-emerald-500" },
  { label: "×", desc: "Nije došao", className: "bg-red-500" },
];

export function CalendarLegend({
  className,
  showClosedHoursBand,
}: {
  className?: string;
  /** Kad kalendar senči vreme van radnog vremena salona. */
  showClosedHoursBand?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
        className
      )}
    >
      <span className="font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Legenda
      </span>
      <ul className="flex flex-wrap gap-4">
        {items.map((i) => (
          <li key={i.label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-md text-[10px] font-bold text-white shadow-sm",
                i.className
              )}
            >
              {i.label}
            </span>
            <span>{i.desc}</span>
          </li>
        ))}
      </ul>
      {showClosedHoursBand ? (
        <span className="flex items-center gap-2 border-l border-slate-200 pl-4 dark:border-slate-600">
          <span
            className="size-6 rounded-md border border-slate-300/80 bg-slate-400/15 dark:border-slate-600 dark:bg-slate-500/20"
            aria-hidden
          />
          <span>Van radnog vremena (iz podešavanja salona)</span>
        </span>
      ) : null}
    </div>
  );
}
