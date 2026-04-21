import type { ClientDetail } from "@/types/client";

export function fileToBase64Part(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    r.onerror = () => reject(new Error("Čitanje fajla nije uspelo."));
    r.readAsDataURL(file);
  });
}

export function statusSr(status: string) {
  if (status === "scheduled") return "Zakazano";
  if (status === "completed") return "Završeno";
  if (status === "no_show") return "Nije došao/la";
  return status;
}

export function formatDt(iso: string) {
  try {
    return new Date(iso).toLocaleString("sr-Latn-RS", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function clientInsights(detail: ClientDetail) {
  const now = Date.now();
  const appts = detail.appointments;
  const scheduled = appts
    .filter((a) => a.status === "scheduled")
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  const next = scheduled.find((a) => new Date(a.date).getTime() >= now);
  const completed = appts
    .filter((a) => a.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  const lastDone = completed[0];
  const therapyStatus = next
    ? "Aktivan · zakazan sledeći dolazak"
    : lastDone
      ? "Poslednji tretman završen"
      : "Bez završenih tretmana u listi";
  const problemLine =
    detail.client.notes?.trim()?.split(/\n/)[0]?.trim() || "—";
  const lastChart = detail.chart_entries[0];
  const therapistNotes =
    lastChart?.notes?.trim() ||
    lastChart?.title?.trim() ||
    "Još nema unosa u karton.";

  return {
    next,
    lastDone,
    therapyStatus,
    problemLine,
    therapistNotes,
  };
}
