"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentRow, AppointmentStatus } from "@/types/appointment";
import { statusBadgeClass } from "./calendar-constants";
import {
  appointmentStaffLabel,
  minutesSinceMidnightInZone,
  ymdInTimeZone,
} from "./calendar-utils";

type Props = {
  dateYmd: string;
  headerLabel: string;
  selected: boolean;
  onSelect: () => void;
  timeZone: string;
  rows: AppointmentRow[];
  onPatchStatus: (id: number, s: AppointmentStatus) => void;
  allowDelete?: boolean;
  onDelete?: (id: number) => void | Promise<void>;
  canAssignStaff?: boolean;
  teamOptions?: { id: number; label: string }[];
  onPatchStaff?: (id: number, staffUserId: number | null) => void | Promise<void>;
  onOpenDetail?: (row: AppointmentRow) => void;
  totalPx: number;
  gridStartMin: number;
  gridEndMin: number;
  hours: number[];
  /** Senčenje van radnog vremena (px, relativno na grid). */
  closedOverlayRects?: { top: number; height: number }[];
  /** Visina jednog sata u px (desktop vs. mobilni kalendar). */
  pxPerHour: number;
};

function WeekGridDraggableBlock({
  row,
  timeZone,
  top,
  height,
  onPatchStatus,
  allowDelete,
  onDelete,
  canAssignStaff,
  teamOptions,
  onPatchStaff,
  onOpenDetail,
}: {
  row: AppointmentRow;
  timeZone: string;
  top: number;
  height: number;
  onPatchStatus: (id: number, s: AppointmentStatus) => void;
  allowDelete?: boolean;
  onDelete?: (id: number) => void | Promise<void>;
  canAssignStaff?: boolean;
  teamOptions?: { id: number; label: string }[];
  onPatchStaff?: (id: number, staffUserId: number | null) => void | Promise<void>;
  onOpenDetail?: (row: AppointmentRow) => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: row.id,
  });

  const t = new Date(row.date).toLocaleTimeString("sr-Latn-RS", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "absolute left-0.5 right-0.5 cursor-grab overflow-hidden rounded-md border px-1 py-0.5 text-left shadow-sm transition hover:z-[3] hover:shadow-md active:cursor-grabbing",
        "touch-none select-none",
        statusBadgeClass(row.status),
        isDragging ? "z-[100] opacity-40 ring-2 ring-sky-400" : "z-[2]"
      )}
      style={{ top, height }}
    >
      <p className="truncate text-[10px] font-semibold tabular-nums text-sky-950">
        {t}
      </p>
      <p className="truncate text-[10px] font-medium leading-tight text-sky-950">
        {row.client_name ?? `#${row.client_id}`}
      </p>
      <p className="truncate text-[9px] text-sky-800/90">
        {row.service_name ?? "Usluga"}
      </p>
      {onOpenDetail ? (
        <button
          type="button"
          title="Detalji termina"
          className="absolute top-0.5 right-0.5 touch-manipulation rounded-md bg-white/90 p-1 text-sky-700 shadow-sm ring-1 ring-sky-200/80 hover:bg-sky-50 max-sm:top-1 max-sm:right-1 max-sm:p-1.5"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(row);
          }}
        >
          <Info className="size-3 max-sm:size-4" aria-hidden />
        </button>
      ) : null}
      {canAssignStaff && teamOptions && onPatchStaff ? (
        <select
          className="mt-0.5 w-full max-w-full truncate rounded border border-sky-200/90 bg-white px-0.5 py-0 text-[8px] text-sky-900"
          value={row.staff_user_id ?? ""}
          title="Radnik"
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const v = e.target.value;
            void onPatchStaff(row.id, v === "" ? null : Number(v));
          }}
        >
          <option value="">— radnik —</option>
          {teamOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      ) : appointmentStaffLabel(row) ? (
        <p className="truncate text-[8px] text-sky-700/85" title="Radnik">
          {appointmentStaffLabel(row)}
        </p>
      ) : null}
      <div className="mt-0.5 flex flex-wrap gap-0.5">
        <button
          type="button"
          title="Zakazano (još uvek aktivan termin)"
          className={cn(
            "touch-manipulation rounded px-1 py-0 text-[9px] font-medium max-sm:min-h-9 max-sm:min-w-9 max-sm:px-1.5 max-sm:text-xs",
            row.status === "scheduled"
              ? "bg-sky-600 text-white"
              : "bg-white/80 text-sky-800 ring-1 ring-sky-200"
          )}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onPatchStatus(row.id, "scheduled");
          }}
        >
          Z
        </button>
        <button
          type="button"
          title="Završeno (usluga odradena)"
          className={cn(
            "touch-manipulation rounded px-1 py-0 text-[9px] font-medium max-sm:min-h-9 max-sm:min-w-9 max-sm:px-1.5 max-sm:text-xs",
            row.status === "completed"
              ? "bg-emerald-600 text-white"
              : "bg-white/80 text-emerald-800 ring-1 ring-emerald-200"
          )}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onPatchStatus(row.id, "completed");
          }}
        >
          V
        </button>
        <button
          type="button"
          title="Nije došao (no-show)"
          className={cn(
            "touch-manipulation rounded px-1 py-0 text-[9px] font-medium max-sm:min-h-9 max-sm:min-w-9 max-sm:px-1.5 max-sm:text-xs",
            row.status === "no_show"
              ? "bg-red-600 text-white"
              : "bg-white/80 text-red-800 ring-1 ring-red-200"
          )}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onPatchStatus(row.id, "no_show");
          }}
        >
          ×
        </button>
        {allowDelete && onDelete ? (
          deleteConfirm ? (
            <>
              <button
                type="button"
                className="rounded bg-red-600 px-1 py-0 text-[9px] font-medium text-white"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  void (async () => {
                    try {
                      await onDelete(row.id);
                    } finally {
                      setDeleteConfirm(false);
                    }
                  })();
                }}
              >
                OK
              </button>
              <button
                type="button"
                className="rounded bg-white/90 px-1 py-0 text-[9px] font-medium text-sky-800 ring-1 ring-sky-200"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(false);
                }}
              >
                ×
              </button>
            </>
          ) : (
            <button
              type="button"
              className="rounded bg-white/90 px-1 py-0 text-[9px] font-medium text-red-700 ring-1 ring-red-200"
              title="Obriši termin"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(true);
              }}
            >
              Briši
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}

export default function DayColumn({
  dateYmd,
  headerLabel,
  selected,
  onSelect,
  timeZone,
  rows,
  onPatchStatus,
  allowDelete,
  onDelete,
  canAssignStaff,
  teamOptions,
  onPatchStaff,
  onOpenDetail,
  totalPx,
  gridStartMin,
  gridEndMin,
  hours,
  closedOverlayRects,
  pxPerHour,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: dateYmd });
  const dayRows = rows.filter(
    (r) => ymdInTimeZone(r.date, timeZone) === dateYmd
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative min-w-[92px] flex-1 border-r border-sky-100 transition-colors last:border-r-0",
        selected
          ? "bg-sky-50/50 ring-1 ring-inset ring-sky-200/60"
          : "bg-white hover:bg-sky-50/25",
        isOver && "bg-sky-100/45 ring-1 ring-inset ring-sky-300"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex min-h-12 w-full shrink-0 touch-manipulation items-center justify-center border-b border-sky-100 px-0.5 text-center text-[11px] font-medium leading-tight transition-colors sm:h-10 sm:min-h-0 sm:text-xs",
          selected
            ? "bg-sky-600 text-white"
            : "bg-white text-sky-900 hover:bg-sky-100/80"
        )}
      >
        {headerLabel}
      </button>
      <div className="relative" style={{ height: totalPx }}>
        {closedOverlayRects?.map((r, i) => (
          <div
            key={i}
            className="pointer-events-none absolute inset-x-0 z-0 bg-slate-400/15 dark:bg-slate-500/20"
            style={{ top: r.top, height: r.height }}
            title="Van radnog vremena salona (podešavanja)"
            aria-hidden
          />
        ))}
        {hours.map((h) => (
          <div
            key={h}
            className="pointer-events-none absolute left-0 right-0 box-border border-b border-sky-100/70"
            style={{
              top: ((h * 60 - gridStartMin) / 60) * pxPerHour,
              height: pxPerHour,
            }}
          />
        ))}
        {dayRows.map((row) => {
          const startMin = minutesSinceMidnightInZone(row.date, timeZone);
          const dur = row.service_duration ?? 30;
          const topRaw =
            ((startMin - gridStartMin) / 60) * pxPerHour;
          const minBlock = pxPerHour >= 52 ? 44 : 24;
          const hRaw = Math.max((dur / 60) * pxPerHour, minBlock);
          const adjTop = Math.max(0, topRaw);
          const adjBottom = Math.min(totalPx, topRaw + hRaw);
          const height = Math.max(adjBottom - adjTop, 6);
          if (
            startMin + dur <= gridStartMin ||
            startMin >= gridEndMin
          ) {
            return null;
          }
          return (
            <WeekGridDraggableBlock
              key={row.id}
              row={row}
              timeZone={timeZone}
              top={adjTop}
              height={height}
              onPatchStatus={onPatchStatus}
              allowDelete={allowDelete}
              onDelete={onDelete}
              canAssignStaff={canAssignStaff}
              teamOptions={teamOptions}
              onPatchStaff={onPatchStaff}
              onOpenDetail={onOpenDetail}
            />
          );
        })}
      </div>
    </div>
  );
}
