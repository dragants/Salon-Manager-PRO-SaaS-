"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createExpense } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { MAX_MONTHLY_OVERHEAD_RSD } from "./finances-utils";

/* ── Overhead Dialog ── */

type OverheadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: string;
  onDraftChange: (v: string) => void;
  onSave: (value: number) => Promise<void>;
};

export function OverheadDialog({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  onSave,
}: OverheadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Okvirni mesečni trošak (fallback)</DialogTitle>
          <DialogDescription>
            Koristi kada još nemaš pojedinačne stavke u tabeli troškova. Čim dodaš
            bar jednu stavku u mesecu, profit koristi zbir iz baze, ne ovo polje.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="overhead">Iznos u RSD</Label>
          <Input
            id="overhead"
            inputMode="numeric"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
          />
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Otkaži
          </Button>
          <Button
            type="button"
            variant="brand"
            onClick={() => {
              const raw = String(draft).trim().replace(/\s/g, "").replace(",", ".");
              const n = Number(raw);
              if (!Number.isFinite(n) || n < 0) {
                toast.error("Unesi validan nenegativan iznos.");
                return;
              }
              const v = Math.min(Math.round(n), MAX_MONTHLY_OVERHEAD_RSD);
              void onSave(v);
            }}
          >
            Sačuvaj
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Expense Dialog ── */

type ExpenseDialogState = {
  title: string;
  amount: string;
  category: string;
  spentAt: string;
};

type ExpenseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: ExpenseDialogState;
  onChange: (patch: Partial<ExpenseDialogState>) => void;
  saving: boolean;
  onSave: () => Promise<void>;
};

export function ExpenseDialog({
  open,
  onOpenChange,
  state,
  onChange,
  saving,
  onSave,
}: ExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novi trošak</DialogTitle>
          <DialogDescription>
            Evidencija rashoda za tekući mesec (i ostale periode koje biraš
            datumom).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="ex-title">Opis</Label>
            <Input
              id="ex-title"
              value={state.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="npr. Zakup prostora"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ex-amt">Iznos (RSD)</Label>
            <Input
              id="ex-amt"
              inputMode="numeric"
              value={state.amount}
              onChange={(e) => onChange({ amount: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ex-cat">Kategorija (opciono)</Label>
            <Input
              id="ex-cat"
              value={state.category}
              onChange={(e) => onChange({ category: e.target.value })}
              placeholder="npr. zakup, marketing"
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ex-date">Datum troška</Label>
            <Input
              id="ex-date"
              type="date"
              value={state.spentAt}
              onChange={(e) => onChange({ spentAt: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Otkaži
          </Button>
          <Button type="button" variant="brand" disabled={saving} onClick={onSave}>
            Sačuvaj
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Payment placeholder dialog ── */

type PaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PaymentDialog({ open, onOpenChange }: PaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj uplatu</DialogTitle>
          <DialogDescription>
            Ručni unos uplate (gotovina, kartica) biće povezan sa izveštajima u
            narednom izdanju. Do tida evidentiraj završene termine u kalendaru —
            prihod se automatski računa iz cena usluga.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Zatvori
          </Button>
          <Button
            type="button"
            variant="brand"
            onClick={() => {
              onOpenChange(false);
              toast.message("Hvala — ručne uplate su na planu.", {
                description: "Označi termin kao završen da se prihod ažurira.",
              });
            }}
          >
            Razumem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
