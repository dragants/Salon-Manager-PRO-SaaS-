import { Loader2 } from "lucide-react";

export function CalendarPageSkeleton() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-2xl border border-sky-100 bg-white/90 px-6 py-16 shadow-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="size-8 animate-spin text-sky-600" aria-hidden />
      <p className="text-sm font-medium text-sky-900">Učitavanje kalendara…</p>
      <p className="max-w-sm text-center text-xs text-sky-700/85">
        Prvi put učitava modul kalendara; sledeća otvaranja su brža.
      </p>
    </div>
  );
}
