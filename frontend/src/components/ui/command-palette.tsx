"use client";

/**
 * Deljivi UI sloj za komandnu paletu (Dialog + pretraga + lista).
 * Stavke (labela + ruta): `lib/command-palette-registry.ts`.
 * Sastavljanje liste: `components/layout/command-palette.tsx`.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export const commandPaletteDialogClassName = cn(
  "max-h-[min(85vh,640px)] w-full max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-[var(--smp-radius-lg)] border border-border bg-card p-0 text-foreground shadow-[var(--smp-shadow-heavy)] sm:max-w-[600px]"
);

export function CommandPaletteSearchRow({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex h-12 min-h-12 shrink-0 items-center gap-2 border-b border-border px-3",
        className
      )}
      {...props}
    />
  );
}

export function CommandPaletteSectionTitle({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function CommandPaletteResults({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("max-h-[320px] overflow-y-auto p-2", className)}
      {...props}
    />
  );
}
