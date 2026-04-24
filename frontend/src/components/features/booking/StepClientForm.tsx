"use client";

import { CalendarDays, Clock, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SurfaceCard } from "@/components/ui/surface-card";
import { WorkerAvatar } from "./booking-shared";
import type { PublicSlot } from "@/lib/api/public-booking";

type SelectedService = {
  id: number;
  name: string;
  price: string | number;
  duration: number;
};

type StepClientFormProps = {
  selectedService: SelectedService | null;
  selectedSlot: PublicSlot | null;
  date: string;
  name: string;
  phone: string;
  email: string;
  emailRequired: boolean;
  formError: string | null;
  submitting: boolean;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  disabled: boolean;
};

export function StepClientForm({
  selectedService,
  selectedSlot,
  date,
  name,
  phone,
  email,
  emailRequired,
  formError,
  submitting,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  onSubmit,
  onBack,
  disabled,
}: StepClientFormProps) {
  return (
    <SurfaceCard
      padding="md"
      className="space-y-4 border-border/90 shadow-[var(--smp-shadow-soft)] ring-1 ring-primary/5"
    >
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <UserRound className="size-4" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Vaši podaci
          </h2>
          <p className="text-xs text-muted-foreground">
            Proveri rezime ispod, unesi kontakt i potvrdi.
          </p>
        </div>
      </div>

      {/* Summary card */}
      {selectedService && selectedSlot ? (
        <div className="flex gap-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-muted/80 to-muted/40 p-4 text-xs shadow-inner ring-1 ring-primary/10">
          <WorkerAvatar
            name={selectedSlot.employee_name ?? "Tim salona"}
            employeeId={selectedSlot.employee_id}
            className="ring-2 ring-background"
          />
          <div className="min-w-0 flex-1 space-y-1 text-muted-foreground">
            <p className="text-sm font-semibold text-foreground">
              {selectedService.name}
            </p>
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-medium">
              <CalendarDays
                className="size-3.5 shrink-0 text-primary"
                aria-hidden
              />
              <span>{date}</span>
              <span className="text-border">·</span>
              <Clock
                className="size-3.5 shrink-0 text-primary"
                aria-hidden
              />
              <span>{selectedSlot.label}</span>
            </p>
            {selectedSlot.employee_name ? (
              <p className="text-[11px]">Sa {selectedSlot.employee_name}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Form fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="pb-name">Ime i prezime</Label>
          <Input
            id="pb-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="border-border bg-card"
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pb-phone">Telefon (za SMS potvrdu)</Label>
          <Input
            id="pb-phone"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className="border-border bg-card"
            autoComplete="tel"
            placeholder="+381…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pb-email">
            E-mail
            {emailRequired ? (
              <span className="font-normal text-red-600 dark:text-red-400">
                {" "}
                *
              </span>
            ) : (
              <span className="font-normal text-muted-foreground">
                {" "}
                (opciono)
              </span>
            )}
          </Label>
          <Input
            id="pb-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="border-border bg-card"
            autoComplete="email"
            placeholder="ime@primer.com"
            required={emailRequired}
          />
          {!emailRequired ? (
            <p className="text-xs text-muted-foreground">
              Ako ga uneseš, salon ga može koristiti za e-mail potvrdu i
              podsetnike (ako su uključeni).
            </p>
          ) : null}
        </div>
      </div>

      {formError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 rounded-xl"
          disabled={submitting}
          onClick={onBack}
        >
          Nazad
        </Button>
        <Button
          type="button"
          variant="brand"
          className="h-11 flex-1 rounded-xl"
          disabled={disabled || submitting}
          onClick={onSubmit}
        >
          {submitting ? "Šaljem…" : "Rezerviši termin"}
        </Button>
      </div>
    </SurfaceCard>
  );
}
