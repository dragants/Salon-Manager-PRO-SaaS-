"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientInsightsAside } from "./client-insights-aside";
import type { ClientDetail } from "@/types/client";

type ClientDetailTabBasicsProps = {
  detail: ClientDetail;
  editName: string;
  editPhone: string;
  editEmail: string;
  editNotes: string;
  onEditName: (v: string) => void;
  onEditPhone: (v: string) => void;
  onEditEmail: (v: string) => void;
  onEditNotes: (v: string) => void;
  onSave: () => void;
  cardSaving: boolean;
  allowDelete: boolean;
  userRole: string | undefined;
  deleteConfirm: boolean;
  onDeleteConfirmChange: (v: boolean) => void;
  deleting: boolean;
  onDelete: () => void;
};

export function ClientDetailTabBasics({
  detail,
  editName,
  editPhone,
  editEmail,
  editNotes,
  onEditName,
  onEditPhone,
  onEditEmail,
  onEditNotes,
  onSave,
  cardSaving,
  allowDelete,
  userRole,
  deleteConfirm,
  onDeleteConfirmChange,
  deleting,
  onDelete,
}: ClientDetailTabBasicsProps) {
  return (
    <div className="grid gap-6 py-2 lg:grid-cols-10 lg:gap-8">
      <ClientInsightsAside detail={detail} />
      <div className="space-y-4 lg:col-span-7">
        <div className="space-y-2">
          <Label htmlFor="ec-name">Ime</Label>
          <Input
            id="ec-name"
            value={editName}
            onChange={(e) => onEditName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ec-phone">Telefon</Label>
          <Input
            id="ec-phone"
            value={editPhone}
            onChange={(e) => onEditPhone(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ec-email">E-mail (opciono)</Label>
          <Input
            id="ec-email"
            type="email"
            autoComplete="email"
            value={editEmail}
            onChange={(e) => onEditEmail(e.target.value)}
            placeholder="za podsetnike i potvrde termina"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ec-notes">Opšta beleška</Label>
          <textarea
            id="ec-notes"
            value={editNotes}
            onChange={(e) => onEditNotes(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={cardSaving || !editName.trim()}
            onClick={() => void onSave()}
          >
            {cardSaving ? "Čuvam…" : "Sačuvaj osnovno"}
          </Button>
        </div>
        <div className="border-t border-red-100 pt-4 dark:border-red-900/40">
          {allowDelete ? (
            <>
              <p className="mb-2 text-xs text-red-800/90 dark:text-red-200/90">
                Brisanje klijenta briše i <strong>zakazane termine</strong>,
                karton i <strong>folder sa prilozima</strong> na serveru
                (nepovratno).
              </p>
              {deleteConfirm ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deleting}
                    onClick={() => void onDelete()}
                  >
                    {deleting ? "Brišem…" : "Potvrdi brisanje"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deleting}
                    onClick={() => onDeleteConfirmChange(false)}
                  >
                    Otkaži
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-200 text-red-800 hover:bg-red-50 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950/40"
                  onClick={() => onDeleteConfirmChange(true)}
                >
                  Obriši klijenta
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {userRole === "worker"
                ? "Brisanje klijenata nije dozvoljeno za tvoj nalog. Administrator može da uključi dozvolu u Podešavanja → Sigurnost."
                : "Brisanje nije dostupno."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
