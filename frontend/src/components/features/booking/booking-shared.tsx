import { Fragment } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  Sparkles,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicSalonPayload, PublicSlot } from "@/lib/api/public-booking";

/* ── Types ── */

export type BookingStep = 1 | 2 | 3 | 4;

export type BookingState = {
  serviceId: number | "";
  date: string;
  selectedSlot: PublicSlot | null;
  name: string;
  phone: string;
  email: string;
};

export type BookingSuccess = {
  summary: string;
  notifyHint: string;
};

/* ── Constants ── */

export const BOOKING_STEPS = [
  { id: 1 as const, label: "Usluga", short: "Usluga", Icon: Sparkles },
  { id: 2 as const, label: "Datum", short: "Datum", Icon: CalendarDays },
  { id: 3 as const, label: "Termin", short: "Termin", Icon: Clock },
  { id: 4 as const, label: "Podaci", short: "Podaci", Icon: UserRound },
] as const;

/* ── Utilities ── */

export function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = s.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h % 360);
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function todayYmdLocal(): string {
  return new Date().toLocaleDateString("en-CA");
}

/* ── WorkerAvatar ── */

export function WorkerAvatar({
  name,
  employeeId,
  size = "md",
  className,
}: {
  name: string | null | undefined;
  employeeId?: number | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const label = name?.trim() || "Tim";
  const initials = initialsFromName(label);
  const hue = hueFromString(`${employeeId ?? ""}:${label}`);
  const sizeCls =
    size === "sm" ? "size-7 text-[10px] ring-2" : "size-9 text-xs ring-2";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold tabular-nums text-white shadow-inner ring-background",
        sizeCls,
        className
      )}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 65% 52%) 0%, hsl(${(hue + 38) % 360} 55% 38%) 100%)`,
      }}
      aria-hidden
      title={name || undefined}
    >
      <span className="drop-shadow-sm">{initials}</span>
    </div>
  );
}

/* ── BookingStepper ── */

export function BookingStepper({ step }: { step: BookingStep }) {
  return (
    <nav
      className="rounded-2xl border border-border/80 bg-card/90 px-2 py-4 shadow-[var(--smp-shadow-soft)] backdrop-blur-sm sm:px-4"
      aria-label="Koraci rezervacije"
    >
      <ol className="flex w-full items-center">
        {BOOKING_STEPS.map(({ id, label, short, Icon }, index) => {
          const done = step > id;
          const active = step === id;
          const prevId = index > 0 ? BOOKING_STEPS[index - 1].id : null;
          const segmentDone = prevId != null && step > prevId;

          return (
            <Fragment key={id}>
              {index > 0 ? (
                <li
                  className="mx-1 flex h-11 min-w-[12px] flex-1 items-center sm:mx-2 sm:h-12"
                  aria-hidden
                >
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        segmentDone
                          ? "w-full bg-primary shadow-[0_0_12px_-2px_rgb(var(--primary)/0.65)]"
                          : "w-0 bg-primary"
                      )}
                    />
                  </div>
                </li>
              ) : null}
              <li className="flex w-[4.25rem] shrink-0 flex-col items-center sm:w-[5.25rem]">
                <div
                  className={cn(
                    "relative flex size-11 items-center justify-center rounded-2xl border-2 transition-all duration-300 sm:size-12",
                    done &&
                      "border-primary bg-primary text-primary-foreground shadow-[0_10px_28px_-10px_rgb(var(--primary)/0.65)]",
                    active &&
                      !done &&
                      "scale-105 border-primary bg-primary/15 text-primary shadow-[0_0_0_4px_rgb(var(--primary)/0.14)] ring-2 ring-primary/30",
                    !active &&
                      !done &&
                      "border-border bg-muted/60 text-muted-foreground"
                  )}
                >
                  {done ? (
                    <Check className="size-5" strokeWidth={2.75} />
                  ) : (
                    <Icon className="size-5" strokeWidth={2} />
                  )}
                  {active ? (
                    <span className="absolute -bottom-1.5 left-1/2 size-2 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_0_3px_var(--background)]" />
                  ) : null}
                </div>
                <span
                  className={cn(
                    "mt-2 hidden max-w-[5.25rem] truncate text-center text-[10px] font-bold uppercase leading-tight tracking-wide sm:block",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    "mt-2 max-w-[4.25rem] truncate text-center text-[9px] font-bold uppercase leading-tight tracking-wide sm:hidden",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {short}
                </span>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

/* ── BookingProgressBar ── */

export function BookingProgressBar({ step }: { step: BookingStep }) {
  const pct = (step / 4) * 100;
  return (
    <div className="space-y-2">
      <div
        className="h-2 overflow-hidden rounded-full bg-muted/80 ring-1 ring-border/60"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Napredak: korak ${step} od 4`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-primary/80 shadow-[0_0_20px_-4px_rgb(var(--primary)/0.7)] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span>
          Korak {step} / 4 — {BOOKING_STEPS[step - 1]?.label}
        </span>
        <span className="tabular-nums text-primary">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}
