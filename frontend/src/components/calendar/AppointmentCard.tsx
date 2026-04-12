"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppointmentRow, AppointmentStatus } from "@/types/appointment";
import { STATUS_LABEL, statusAccentBorder, statusBadgeClass } from "./calendar-constants";
import { appointmentStaffLabel } from "./calendar-utils";

type Props = {
  appointment: AppointmentRow;
  timeLabel: string;
  onPatchStatus: (id: number, status: AppointmentStatus) => void;
  allowDelete?: boolean;
  onDelete?: (id: number) => void | Promise<void>;
  highlight?: boolean;
  canAssignStaff?: boolean;
  teamOptions?: { id: number; label: string }[];
  onPatchStaff?: (id: number, staffUserId: number | null) => void | Promise<void>;
};

export default function AppointmentCard({
  appointment: row,
  timeLabel,
  onPatchStatus,
  allowDelete = false,
  onDelete,
  highlight = false,
  canAssignStaff = false,
  teamOptions,
  onPatchStaff,
}: Props) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  return (
    <div
      id={`cal-appt-${row.id}`}
      className={cn(
        "group rounded-xl border border-sky-100 bg-white p-4 shadow-sm transition-all duration-200 hover:border-sky-200 hover:shadow-md",
        "border-l-4",
        statusAccentBorder(row.status),
        highlight && "ring-2 ring-sky-500 ring-offset-2"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold tabular-nums text-sky-950">
              {timeLabel}
            </span>
            <Badge
              variant="outline"
              className={cn("font-normal shadow-sm", statusBadgeClass(row.status))}
            >
              {STATUS_LABEL[row.status]}
            </Badge>
          </div>
          <p className="truncate font-medium text-sky-950">
            {row.client_name ?? `Klijent #${row.client_id}`}
          </p>
          <p className="text-sm text-sky-800/85">
            {row.service_name ?? `Usluga #${row.service_id}`}
            {row.service_duration != null ? ` · ${row.service_duration} min` : ""}
          </p>
          {canAssignStaff && teamOptions && onPatchStaff ? (
            <div className="pt-1">
              <label className="sr-only" htmlFor={`staff-${row.id}`}>
                Radnik
              </label>
              <select
                id={`staff-${row.id}`}
                className="mt-1 w-full max-w-xs rounded-lg border border-sky-200 bg-white px-2 py-1 text-xs text-sky-900"
                value={row.staff_user_id ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  void onPatchStaff(row.id, v === "" ? null : Number(v));
                }}
              >
                <option value="">Bez dodele</option>
                {teamOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ) : appointmentStaffLabel(row) ? (
            <p className="text-xs text-sky-700/90">
              Radnik: {appointmentStaffLabel(row)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5 opacity-95 transition group-hover:opacity-100">
          <Button
            type="button"
            size="sm"
            variant={row.status === "scheduled" ? "default" : "outline"}
            className={
              row.status === "scheduled"
                ? "bg-sky-600 hover:bg-sky-700"
                : "border-sky-200"
            }
            onClick={() => onPatchStatus(row.id, "scheduled")}
          >
            Zakazano
          </Button>
          <Button
            type="button"
            size="sm"
            variant={row.status === "completed" ? "default" : "outline"}
            className={
              row.status === "completed"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "border-emerald-200"
            }
            onClick={() => onPatchStatus(row.id, "completed")}
          >
            Završeno
          </Button>
          <Button
            type="button"
            size="sm"
            variant={row.status === "no_show" ? "default" : "outline"}
            className={
              row.status === "no_show"
                ? "bg-red-600 hover:bg-red-700"
                : "border-red-200"
            }
            onClick={() => onPatchStatus(row.id, "no_show")}
          >
            Nije došao
          </Button>
          {allowDelete && onDelete ? (
            deleteConfirm ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    void (async () => {
                      try {
                        await onDelete(row.id);
                      } finally {
                        setDeleteConfirm(false);
                      }
                    })();
                  }}
                >
                  Potvrdi brisanje
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteConfirm(false)}
                >
                  Otkaži
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-red-200 text-red-800 hover:bg-red-50"
                onClick={() => setDeleteConfirm(true)}
              >
                Obriši termin
              </Button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
