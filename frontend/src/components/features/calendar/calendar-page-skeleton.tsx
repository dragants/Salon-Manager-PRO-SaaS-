import { Loader2 } from "lucide-react";

export function CalendarPageSkeleton() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-[var(--smp-radius-lg)] border border-border bg-card px-6 py-16 shadow-[var(--smp-shadow-soft)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm font-medium text-foreground">Učitavanje kalendara…</p>
      <p className="max-w-sm text-center text-xs text-muted-foreground">
        Prvi put učitava modul kalendara; sledeća otvaranja su brža.
      </p>
    </div>
  );
}
