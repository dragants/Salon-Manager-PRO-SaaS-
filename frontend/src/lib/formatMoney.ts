/** Formatiranje iznosa u dinarima (RSD) za sr-Latn locale. */
export function formatRsd(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "—";
  }
  const n = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (Number.isNaN(n)) {
    return "—";
  }
  return n.toLocaleString("sr-Latn-RS", {
    style: "currency",
    currency: "RSD",
    maximumFractionDigits: 0,
  });
}
