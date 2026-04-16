export function AnalyticsChartSkeleton() {
  return (
    <div
      className="flex h-[320px] items-center justify-center rounded-xl border border-sky-100 bg-gradient-to-b from-sky-50/60 to-white text-sm text-sky-600"
      role="status"
      aria-live="polite"
    >
      Učitavanje grafikona…
    </div>
  );
}
