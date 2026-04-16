/** Lokalni mesečni trošak (do API-ja za knjigovodstvo). */

const KEY = "salon_fin_monthly_overhead_rsd";

export function getMonthlyOverheadRsd(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  const raw = window.localStorage.getItem(KEY);
  if (raw == null || raw === "") {
    return 0;
  }
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export function setMonthlyOverheadRsd(value: number): void {
  if (typeof window === "undefined") {
    return;
  }
  const n = Math.max(0, Math.round(value));
  window.localStorage.setItem(KEY, String(n));
}
