"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PaywallDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  /** Bullet lista benefita (npr. „Neograničeno termina“). */
  features?: string[];
  upgradeLabel?: string;
  dismissLabel?: string;
  onUpgrade?: () => void;
  onDismiss?: () => void;
  className?: string;
};

export function PaywallDialog({
  open,
  onOpenChange,
  title = "Dostigli ste limit",
  description =
    "Dostigli ste maksimalan broj klijenata za vaš plan.",
  features = [
    "Neograničen broj klijenata",
    "SMS podsetnici",
    "Napredna analitika",
  ],
  upgradeLabel = "Nadogradi na Pro",
  dismissLabel = "Kasnije",
  onUpgrade,
  onDismiss,
  className,
}: PaywallDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn("max-w-md gap-0 overflow-hidden p-0 sm:max-w-md", className)}
      >
        <div className="bg-gradient-to-br from-primary/15 via-card to-card px-5 pb-4 pt-5">
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="text-lg">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <ul className="mt-4 space-y-2.5">
            {features.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <Check className="size-3.5" aria-hidden />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2 border-t border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="brand"
            className="w-full sm:flex-1"
            onClick={() => {
              onUpgrade?.();
            }}
          >
            {upgradeLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              onDismiss?.();
              onOpenChange(false);
            }}
          >
            {dismissLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Isto kao PaywallDialog — ime iz UI kit reference fajla. */
export { PaywallDialog as PaywallModal };
