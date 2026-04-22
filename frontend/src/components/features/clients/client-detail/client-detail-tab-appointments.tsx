"use client";

import { appointmentStaffLabel } from "@/components/features/calendar/calendar-utils";
import { formatDt, statusSr } from "@/lib/clients-page-utils";
import type { ClientDetail } from "@/types/client";

type ClientDetailTabAppointmentsProps = {
  detail: ClientDetail;
};

export function ClientDetailTabAppointments({
  detail,
}: ClientDetailTabAppointmentsProps) {
  return (
    <div className="space-y-3 py-2">
      <p className="text-sm text-muted-foreground">
        Zakazivanja iz kalendara za ovog klijenta.
      </p>
      {detail.appointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nema zapisa.</p>
      ) : (
        <ul className="space-y-2">
          {detail.appointments.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-border/90 bg-muted/80 px-3 py-2 text-sm dark:bg-card/50"
            >
              <div className="font-medium text-foreground">{a.service_name}</div>
              <div className="text-muted-foreground">
                {formatDt(a.date)} · {a.duration} min · {statusSr(a.status)}
                {appointmentStaffLabel(a)
                  ? ` · ${appointmentStaffLabel(a)}`
                  : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
