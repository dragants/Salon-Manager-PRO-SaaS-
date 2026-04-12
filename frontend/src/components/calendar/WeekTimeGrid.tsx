"use client";

import { useState } from "react";
import {
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { parseYyyyMmDd } from "@/lib/dateLocal";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AppointmentRow, AppointmentStatus } from "@/types/appointment";
import {
  GRID_END_HOUR,
  GRID_START_HOUR,
  PX_PER_HOUR,
  PX_PER_HOUR_COMPACT,
  STATUS_LABEL,
  statusBadgeClass,
} from "./calendar-constants";
import { useIsNarrowCalendar } from "@/lib/use-is-narrow-calendar";
import DragCalendar from "./DragCalendar";
import DayColumn from "./DayColumn";
import { closedOverlayPxForDay } from "@/lib/calendar-grid-bounds";
import {
  appointmentStaffLabel,
  rescheduleIsoWithSnap,
  ymdInTimeZone,
} from "./calendar-utils";

type Props = {
  weekDays: string[];
  rows: AppointmentRow[];
  timeZone: string;
  selectedDay: string;
  onSelectDay: (d: string) => void;
  onPatchStatus: (id: number, s: AppointmentStatus) => void;
  onReschedule?: (id: number, newDateIso: string) => void | Promise<void>;
  allowDelete?: boolean;
  onDelete?: (id: number) => void | Promise<void>;
  canAssignStaff?: boolean;
  teamOptions?: { id: number; label: string }[];
  onPatchStaff?: (id: number, staffUserId: number | null) => void | Promise<void>;
  /** Dinamički opseg (npr. radno vreme); podrazumevano 7–22. */
  gridStartHour?: number;
  gridEndHour?: number;
  /** Ako postoji, kolone prikazuju blago senčenje van `working_hours`. */
  orgWorkingHours?: Record<string, unknown>;
};

export default function WeekTimeGrid({
  weekDays,
  rows,
  timeZone,
  selectedDay,
  onSelectDay,
  onPatchStatus,
  onReschedule,
  allowDelete,
  onDelete,
  canAssignStaff,
  teamOptions,
  onPatchStaff,
  gridStartHour = GRID_START_HOUR,
  gridEndHour = GRID_END_HOUR,
  orgWorkingHours,
}: Props) {
  const [activeDrag, setActiveDrag] = useState<AppointmentRow | null>(null);
  const [detailRow, setDetailRow] = useState<AppointmentRow | null>(null);
  const narrow = useIsNarrowCalendar();
  const pxPerHour = narrow ? PX_PER_HOUR_COMPACT : PX_PER_HOUR;

  const startH = Math.max(0, Math.min(23, gridStartHour));
  const endH = Math.max(startH + 1, Math.min(24, gridEndHour));
  const totalPx = (endH - startH) * pxPerHour;
  const gridStartMin = startH * 60;
  const gridEndMin = endH * 60;
  const hours: number[] = [];
  for (let h = startH; h < endH; h++) {
    hours.push(h);
  }

  function handleDragStart(event: DragStartEvent) {
    const id = Number(event.active.id);
    setActiveDrag(rows.find((r) => r.id === id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over || !onReschedule) {
      return;
    }
    const targetYmd = String(over.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetYmd)) {
      return;
    }
    const id = Number(active.id);
    const row = rows.find((r) => r.id === id);
    if (!row) {
      return;
    }
    if (ymdInTimeZone(row.date, timeZone) === targetYmd) {
      return;
    }
    const newIso = rescheduleIsoWithSnap(row.date, targetYmd, timeZone);
    void Promise.resolve(onReschedule(id, newIso));
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-sky-100 bg-white py-16 text-center text-sm text-sky-700/80 shadow-sm">
        Nema termina ove nedelje. Dodaj termin ili promeni nedelju.
      </p>
    );
  }

  const gridInner = (
    <div className="max-h-[min(70vh,640px)] overflow-auto rounded-xl border border-sky-100 bg-white shadow-sm max-sm:max-h-[min(82vh,760px)]">
      <div className="flex min-w-[760px] touch-pan-x touch-pan-y">
        <div className="sticky left-0 z-20 w-11 shrink-0 border-r border-sky-100 bg-white">
          <div className="h-10 shrink-0 border-b border-sky-100" aria-hidden />
          {hours.map((h) => (
            <div
              key={h}
              className="box-border border-b border-sky-50 pr-1 pt-0.5 text-right text-[10px] tabular-nums text-sky-600"
              style={{ height: pxPerHour }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        <div className="flex min-w-0 flex-1">
          {weekDays.map((d) => (
            <DayColumn
              key={d}
              dateYmd={d}
              headerLabel={parseYyyyMmDd(d).toLocaleDateString("sr-Latn-RS", {
                weekday: "short",
                day: "numeric",
              })}
              selected={d === selectedDay}
              onSelect={() => onSelectDay(d)}
              timeZone={timeZone}
              rows={rows}
              onPatchStatus={onPatchStatus}
              allowDelete={allowDelete}
              onDelete={onDelete}
              canAssignStaff={canAssignStaff}
              teamOptions={teamOptions}
              onPatchStaff={onPatchStaff}
              onOpenDetail={(row) => setDetailRow(row)}
              totalPx={totalPx}
              gridStartMin={gridStartMin}
              gridEndMin={gridEndMin}
              hours={hours}
              closedOverlayRects={closedOverlayPxForDay({
                dateYmd: d,
                timeZone,
                workingHours: orgWorkingHours,
                gridStartMin,
                gridEndMin,
                pxPerHour,
              })}
              pxPerHour={pxPerHour}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const detailDialog = (
    <Dialog open={detailRow != null} onOpenChange={(o) => !o && setDetailRow(null)}>
      <DialogContent className="border-sky-100 sm:max-w-md" showCloseButton>
        {detailRow ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {new Date(detailRow.date).toLocaleString("sr-Latn-RS", {
                  timeZone,
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </DialogTitle>
              <DialogDescription>
                {STATUS_LABEL[detailRow.status]} ·{" "}
                {detailRow.client_name ?? `Klijent #${detailRow.client_id}`}
              </DialogDescription>
            </DialogHeader>
            <dl className="space-y-2 text-sm text-sky-900">
              <div>
                <dt className="text-xs text-sky-600">Usluga</dt>
                <dd className="font-medium">
                  {detailRow.service_name ?? `#${detailRow.service_id}`}
                </dd>
              </div>
              {appointmentStaffLabel(detailRow) ? (
                <div>
                  <dt className="text-xs text-sky-600">Radnik</dt>
                  <dd>{appointmentStaffLabel(detailRow)}</dd>
                </div>
              ) : null}
            </dl>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );

  if (!onReschedule) {
    return (
      <>
        {gridInner}
        {detailDialog}
      </>
    );
  }

  const overlayTime =
    activeDrag &&
    new Date(activeDrag.date).toLocaleTimeString("sr-Latn-RS", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    });

  return (
    <DragCalendar onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {gridInner}
      {detailDialog}
      <DragOverlay dropAnimation={null}>
        {activeDrag ? (
          <div
            className={cn(
              "w-44 rounded-lg border px-2 py-1.5 shadow-xl",
              statusBadgeClass(activeDrag.status)
            )}
          >
            <p className="text-[10px] font-semibold tabular-nums text-sky-950">
              {overlayTime}
            </p>
            <p className="truncate text-[11px] font-medium text-sky-950">
              {activeDrag.client_name ?? `#${activeDrag.client_id}`}
            </p>
            <p className="truncate text-[10px] text-sky-800/90">
              {activeDrag.service_name ?? "Usluga"}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DragCalendar>
  );
}
