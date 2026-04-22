"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppointmentRow, AppointmentStatus } from "@/types/appointment";
import {
  STATUS_LABEL,
  statusAccentBorder,
  statusBadgeClass,
} from "./calendar-constants";
import { appointmentStaffLabel } from "./calendar-utils";

/* ── Segmented status control ── */

const STATUS_OPTIONS: {
  value: AppointmentStatus;
  label: string;
  activeClass: string;
}[] = [
  {
    value: "scheduled",
    label: "Zakazano",
    activeClass:
      "bg-primary text-primary-foreground shadow-sm",
  },
  {
    value: "completed",
    label: "Završeno",
    activeClass:
      "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500",
  },
  {
    value: "no_show",
    label: "Nije došao",
    activeClass:
      "bg-red-600 text-white shadow-sm dark:bg-red-500",
  },
  {
    value: "cancelled",
    label: "Otkazano",
    activeClass:
      "bg-slate-500 text-white shadow-sm dark:bg-slate-400",
  },
];

function StatusSegment({
  current,
  onChange,
}: {
  current: AppointmentStatus;
  onChange: (status: AppointmentStatus) => void;
}) {
  return (
    <div className="inline-flex items-center gap-px rounded-xl border border-border bg-muted/60 p-0.5">
      {STATUS_OPTIONS.map(({ value, label, activeClass }) => {
        const isActive = current === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={cn(
              "rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-all duration-150",
              isActive
                ? activeClass
                : "text-muted-foreground hover:text-foreground hover:bg-background/80"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Card ── */

type Props = {
  appointment: AppointmentRow;
  timeLabel: string;
  onPatchStatus: (id: number, status: AppointmentStatus) => void;
  allowDelete?: boolean;
  onDelete?: (id: number) => void | Promise<void>;
  highlight?: boolean;
  canAssignStaff?: boolean;
  teamOptions?: { id: number; label: string }[];
  onPatchStaff?: (
    id: number,
    staffUserId: number | null
  ) => void | Promise<void>;
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
        "group rounded-[var(--smp-radius-lg)] border border-border bg-card p-4 shadow-[var(--smp-shadow-soft)] transition-all duration-200 hover:border-primary/30 hover:shadow-[var(--smp-shadow-hover)]",
        "border-l-4",
        statusAccentBorder(row.status),
        highlight &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {timeLabel}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "font-normal shadow-sm",
                statusBadgeClass(row.status)
              )}
            >
              {STATUS_LABEL[row.status]}
            </Badge>
            {appointmentStaffLabel(row) && !canAssignStaff ? (
              <span className="text-xs text-muted-foreground sm:ml-auto">
                Radnik: {appointmentStaffLabel(row)}
              </span>
            ) : null}
          </div>
          <p className="truncate font-medium text-foreground">
            {row.client_name ?? `Klijent #${row.client_id}`}
          </p>
          <p className="text-sm text-muted-foreground">
            {row.service_name ?? `Usluga #${row.service_id}`}
            {row.service_duration != null
              ? ` · ${row.service_duration} min`
              : ""}
          </p>
          {canAssignStaff && teamOptions && onPatchStaff ? (
            <div className="pt-1">
              <label className="sr-only" htmlFor={`staff-${row.id}`}>
                Radnik
              </label>
              <select
                id={`staff-${row.id}`}
                className="mt-1 w-full max-w-xs rounded-lg border border-border bg-[var(--smp-input-bg)] px-2 py-1 text-xs text-foreground"
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
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:min-w-0 sm:max-w-full sm:items-end">
          <div className="sm:hidden">
            <label className="sr-only" htmlFor={`status-${row.id}`}>
              Status termina
            </label>
            <select
              id={`status-${row.id}`}
              className="h-10 w-full rounded-xl border border-border bg-[var(--smp-input-bg)] px-3 text-sm font-semibold text-foreground"
              value={row.status}
              onChange={(e) =>
                onPatchStatus(row.id, e.target.value as AppointmentStatus)
              }
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden w-full min-w-0 flex-wrap justify-end gap-y-2 sm:flex">
            <StatusSegment
              current={row.status}
              onChange={(status) => onPatchStatus(row.id, status)}
            />
          </div>

          {allowDelete && onDelete ? (
            <div className="flex flex-wrap justify-end gap-1.5">
              {deleteConfirm ? (
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
                    Potvrdi
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => setDeleteConfirm(false)}
                  >
                    Otkaži
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteConfirm(true)}
                >
                  Obriši
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
