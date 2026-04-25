import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale";

export function CalendarLegend({
  className,
  showClosedHoursBand,
}: {
  className?: string;
  /** Kad kalendar senči vreme van radnog vremena salona. */
  showClosedHoursBand?: boolean;
}) {
  const t = useT();
  const items = [
    {
      label: "Z",
      desc: t.common.status.scheduled,
      className: "bg-primary text-primary-foreground",
    },
    {
      label: "V",
      desc: t.common.status.completed,
      className: "bg-emerald-500 text-white",
    },
    {
      label: "×",
      desc: t.common.status.no_show,
      className: "bg-red-500 text-white",
    },
  ];
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-[var(--smp-radius-lg)] border border-border bg-card px-4 py-3 text-xs text-muted-foreground shadow-[var(--smp-shadow-soft)]",
        className
      )}
    >
      <span className="font-semibold uppercase tracking-wide text-foreground/80">
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
        <span className="flex items-center gap-2 border-l border-border pl-4">
          <span
            className="size-6 rounded-md border border-border bg-white/[0.06]"
            aria-hidden
          />
          <span>Van radnog vremena (iz podešavanja salona)</span>
        </span>
      ) : null}
    </div>
  );
}
