"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  clampShiftToTimeline,
  DEFAULT_NEW_SHIFT_HOURS,
  shiftLayoutPct,
  shiftTimeLabels,
  snapToQuarterHours,
} from "@/lib/shift-planner";
import type { ShiftPlannerShift } from "@/types/shift";
import { SHIFT_PLANNER_END_HOUR } from "@/components/features/calendar/calendar-constants";

export type ShiftPlannerEmployee = {
  id: number;
  name: string;
};

const EMPLOYEE_PALETTE = [
  {
    bar: "bg-primary border-primary/80 shadow-primary/20",
    text: "text-white",
  },
  {
    bar: "bg-emerald-500 border-emerald-600/80 shadow-emerald-900/20",
    text: "text-white",
  },
  {
    bar: "bg-violet-500 border-violet-600/80 shadow-violet-900/20",
    text: "text-white",
  },
  {
    bar: "bg-amber-500 border-amber-600/80 shadow-amber-900/20",
    text: "text-white",
  },
  {
    bar: "bg-rose-500 border-rose-600/80 shadow-rose-900/20",
    text: "text-white",
  },
  {
    bar: "bg-cyan-600 border-cyan-700/80 shadow-cyan-900/20",
    text: "text-white",
  },
] as const;

function dropId(employeeId: number, hour: number) {
  return `emp-${employeeId}-h-${hour}`;
}

function parseDropId(
  id: string | number | undefined
): { employeeId: number; hour: number } | null {
  if (id == null) return null;
  const s = String(id);
  const m = /^emp-(\d+)-h-(\d+)$/.exec(s);
  if (!m) return null;
  return { employeeId: Number(m[1]), hour: Number(m[2]) };
}

function employeeColorIndex(employees: ShiftPlannerEmployee[], id: number) {
  const i = employees.findIndex((e) => e.id === id);
  return i < 0 ? 0 : i % EMPLOYEE_PALETTE.length;
}

type HourCellProps = {
  employeeId: number;
  hour: number;
  onEmptyClick: (employeeId: number, hour: number) => void;
};

function HourCell({ employeeId, hour, onEmptyClick }: HourCellProps) {
  const id = dropId(employeeId, hour);
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={() => onEmptyClick(employeeId, hour)}
      className={cn(
        "relative z-0 min-h-14 min-w-0 flex-1 border-l border-primary/10 transition-colors",
        "hover:bg-primary/10/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary",
        isOver && "bg-primary/10"
      )}
      aria-label={`Dodaj ili pomeri smenu na ${hour}:00`}
    />
  );
}

type ShiftBlockProps = {
  shift: ShiftPlannerShift;
  employees: ShiftPlannerEmployee[];
  hourStart: number;
  hourEnd: number;
  onResizeDuration: (shiftId: string, durationHours: number) => void;
  onRemove: (shiftId: string) => void;
};

function ShiftBlock({
  shift,
  employees,
  hourStart,
  hourEnd,
  onResizeDuration,
  onRemove,
}: ShiftBlockProps) {
  const range = hourEnd - hourStart;
  const { leftPct, widthPct } = shiftLayoutPct(
    shift.startHour,
    shift.durationHours,
    hourStart,
    hourEnd
  );
  const pal = EMPLOYEE_PALETTE[employeeColorIndex(employees, shift.employee_id)];
  const name =
    employees.find((e) => e.id === shift.employee_id)?.name ?? `#${shift.employee_id}`;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: shift.id,
    data: { shift },
  });

  const resizeRef = useRef<{ startX: number; startDur: number } | null>(null);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const row = (e.currentTarget as HTMLElement).closest(
        "[data-timeline-row]"
      );
      const w = row?.getBoundingClientRect().width ?? 640;
      resizeRef.current = { startX: e.clientX, startDur: shift.durationHours };

      const onMove = (ev: PointerEvent) => {
        const r = resizeRef.current;
        if (!r) return;
        const dx = ev.clientX - r.startX;
        const dHours = (dx / w) * range;
        let next = snapToQuarterHours(r.startDur + dHours);
        next = Math.max(0.25, Math.min(hourEnd - shift.startHour, next));
        onResizeDuration(shift.id, next);
      };

      const onUp = () => {
        resizeRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [hourEnd, onResizeDuration, range, shift.durationHours, shift.id, shift.startHour]
  );

  const { start: startLabel, end: endLabel } = shiftTimeLabels(
    shift.startHour,
    shift.durationHours
  );
  const tooltip = `${name}\n${startLabel} – ${endLabel}`;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute top-1 z-10 min-h-[2.75rem] min-w-[3rem] cursor-grab overflow-hidden rounded-lg border px-0 text-left shadow-md select-none touch-none active:cursor-grabbing",
        pal.bar,
        pal.text,
        isDragging && "z-20 opacity-50 ring-2 ring-white/90"
      )}
      style={{
        left: `${leftPct}%`,
        width: `${Math.max(widthPct, 4)}%`,
      }}
    >
      <div
        className="flex h-full min-h-[inherit] min-w-0 flex-col justify-center px-2 py-1 pr-2.5"
        {...listeners}
        {...attributes}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onRemove(shift.id);
        }}
        title={`${tooltip}\n(Dvoklik briše smenu.)`}
      >
        <span className="truncate text-[10px] font-semibold leading-tight">
          {startLabel} – {endLabel}
        </span>
        <span className="truncate text-[9px] opacity-90">{name}</span>
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        className="pointer-events-auto absolute inset-y-0 right-0 z-20 w-2 cursor-ew-resize border-l border-white/30 bg-black/10 hover:bg-black/20"
        onPointerDown={onResizePointerDown}
        title="Povuci za duže/kraće trajanje"
      />
    </div>
  );
}

function ShiftDragPreview({
  shift,
  employees,
}: {
  shift: ShiftPlannerShift;
  employees: ShiftPlannerEmployee[];
}) {
  const pal = EMPLOYEE_PALETTE[employeeColorIndex(employees, shift.employee_id)];
  const name =
    employees.find((e) => e.id === shift.employee_id)?.name ?? `#${shift.employee_id}`;
  const { start: startLabel, end: endLabel } = shiftTimeLabels(
    shift.startHour,
    shift.durationHours
  );

  return (
    <div
      className={cn(
        "flex w-48 cursor-grabbing rounded-lg border px-2 py-2 text-xs shadow-xl",
        pal.bar,
        pal.text
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {startLabel} – {endLabel}
        </p>
        <p className="truncate opacity-90">{name}</p>
      </div>
    </div>
  );
}

export type ShiftPlannerProps = {
  date: string;
  employees: ShiftPlannerEmployee[];
  shifts: ShiftPlannerShift[];
  onShiftsChange: (next: ShiftPlannerShift[]) => void;
  hourStart?: number;
  hourEnd?: number;
  className?: string;
};

export default function ShiftPlanner({
  date,
  employees,
  shifts,
  onShiftsChange,
  hourStart = 8,
  hourEnd = SHIFT_PLANNER_END_HOUR,
  className,
}: ShiftPlannerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = hourStart; h < hourEnd; h++) {
      list.push(h);
    }
       return list;
  }, [hourStart, hourEnd]);

  const addShiftAt = useCallback(
    (employeeId: number, hour: number) => {
      const { startHour, durationHours } = clampShiftToTimeline(
        hour,
        DEFAULT_NEW_SHIFT_HOURS,
        hourStart,
        hourEnd
      );
      const next: ShiftPlannerShift = {
        id: crypto.randomUUID(),
        employee_id: employeeId,
        date,
        startHour,
        durationHours,
      };
      onShiftsChange([...shifts, next]);
    },
    [date, hourEnd, hourStart, onShiftsChange, shifts]
  );

  const onResizeDuration = useCallback(
    (shiftId: string, durationHours: number) => {
      onShiftsChange(
        shifts.map((s) => {
          if (s.id !== shiftId) return s;
          const clamped = clampShiftToTimeline(
            s.startHour,
            durationHours,
            hourStart,
            hourEnd
          );
          return { ...s, durationHours: clamped.durationHours };
        })
      );
    },
    [hourEnd, hourStart, onShiftsChange, shifts]
  );

  const onRemoveShift = useCallback(
    (shiftId: string) => {
      onShiftsChange(shifts.filter((s) => s.id !== shiftId));
    },
    [onShiftsChange, shifts]
  );

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = e;
      if (!over) return;
      const parsed = parseDropId(over.id as string);
      if (!parsed) return;
      const sid = String(active.id);
      const moving = shifts.find((s) => s.id === sid);
      if (!moving) return;

      const { startHour, durationHours } = clampShiftToTimeline(
        parsed.hour,
        moving.durationHours,
        hourStart,
        hourEnd
      );

      onShiftsChange(
        shifts.map((s) =>
          s.id === sid
            ? {
                ...s,
                employee_id: parsed.employeeId,
                startHour,
                durationHours,
                date,
              }
            : s
        )
      );
    },
    [date, hourEnd, hourStart, onShiftsChange, shifts]
  );

  const activeShift = activeId ? shifts.find((s) => s.id === activeId) : null;

  if (employees.length === 0) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900">
        Nema članova tima. Dodaj zaposlene u podešavanjima (Tim).
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-sm",
          className
        )}
      >
        {/* Header row */}
        <div className="flex min-w-0 border-b border-primary/10 bg-primary/5">
          <div className="sticky left-0 z-30 w-36 shrink-0 border-r border-primary/10 bg-primary/5 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-primary sm:w-44">
            Zaposleni
          </div>
          <div className="flex min-w-[520px] flex-1">
            {hours.map((h) => (
              <div
                key={h}
                className="min-h-10 flex-1 border-l border-primary/10 py-2 text-center text-[11px] font-medium tabular-nums text-primary"
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
        </div>

        {/* Employee rows */}
        <div className="max-h-[min(70vh,720px)] overflow-auto">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="flex min-w-0 border-b border-primary/5 last:border-b-0"
            >
              <div className="sticky left-0 z-20 w-36 shrink-0 border-r border-primary/10 bg-card px-3 py-3 text-sm font-medium text-sky-950 sm:w-44">
                <span className="line-clamp-2">{emp.name}</span>
              </div>
              <div
                data-timeline-row
                className="relative flex min-h-14 min-w-[520px] flex-1 bg-white"
              >
                {hours.map((h) => (
                  <HourCell
                    key={h}
                    employeeId={emp.id}
                    hour={h}
                    onEmptyClick={addShiftAt}
                  />
                ))}
                {shifts
                  .filter((s) => s.employee_id === emp.id && s.date === date)
                  .map((s) => (
                    <ShiftBlock
                      key={s.id}
                      shift={s}
                      employees={employees}
                      hourStart={hourStart}
                      hourEnd={hourEnd}
                      onResizeDuration={onResizeDuration}
                      onRemove={onRemoveShift}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>

        <p className="border-t border-primary/10 bg-primary/5 px-4 py-2 text-[11px] text-primary/90">
          Prevuci blok da pomeriš početak i radnika · uska traka skroz desno
          menja trajanje · prazan sat dodaje smenu ({DEFAULT_NEW_SHIFT_HOURS}h) ·
          dvoklik briše. Obojena širina odgovara tekstu (npr. 09:00–13:00 ide do
          vertikale ispod „13:00“). Posle pauze 10–11 sledeći blok počinje u
          11:00.
        </p>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeShift ? (
          <ShiftDragPreview shift={activeShift} employees={employees} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
