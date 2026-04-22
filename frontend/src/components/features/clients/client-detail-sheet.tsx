"use client";

import { ClientDetailTabAppointments } from "./client-detail/client-detail-tab-appointments";
import { ClientDetailTabBar } from "./client-detail/client-detail-tab-bar";
import { ClientDetailTabBasics } from "./client-detail/client-detail-tab-basics";
import { ClientDetailTabChart } from "./client-detail/client-detail-tab-chart";
import { ClientDetailTabLoyalty } from "./client-detail/client-detail-tab-loyalty";
import { useClientDetailSheet } from "./client-detail/use-client-detail-sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ClientDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number | null;
  allowDelete: boolean;
  userRole: string | undefined;
  onClientUpdated: () => void | Promise<void>;
};

export function ClientDetailSheet({
  open,
  onOpenChange,
  clientId,
  allowDelete,
  userRole,
  onClientUpdated,
}: ClientDetailSheetProps) {
  const sheet = useClientDetailSheet({
    open,
    clientId,
    onOpenChange,
    onClientUpdated,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92vh] flex-col border-border sm:max-w-4xl lg:max-w-5xl"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>
            {sheet.detail ? sheet.detail.client.name : "Kartica klijenta"}
          </DialogTitle>
        </DialogHeader>

        {sheet.detailError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            {sheet.detailError}
          </div>
        ) : null}

        {sheet.detailLoading && !sheet.detail ? (
          <p className="text-sm text-muted-foreground">Učitavanje kartice…</p>
        ) : null}

        {sheet.detail ? (
          <>
            <ClientDetailTabBar
              active={sheet.cardTab}
              onChange={sheet.setCardTab}
            />

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {sheet.cardTab === "loyalty" ? (
                <ClientDetailTabLoyalty detail={sheet.detail} />
              ) : null}

              {sheet.cardTab === "osnovno" ? (
                <ClientDetailTabBasics
                  detail={sheet.detail}
                  editName={sheet.editName}
                  editPhone={sheet.editPhone}
                  editEmail={sheet.editEmail}
                  editNotes={sheet.editNotes}
                  onEditName={sheet.setEditName}
                  onEditPhone={sheet.setEditPhone}
                  onEditEmail={sheet.setEditEmail}
                  onEditNotes={sheet.setEditNotes}
                  onSave={sheet.onSaveClientBasics}
                  cardSaving={sheet.cardSaving}
                  allowDelete={allowDelete}
                  userRole={userRole}
                  deleteConfirm={sheet.deleteConfirm}
                  onDeleteConfirmChange={sheet.setDeleteConfirm}
                  deleting={sheet.deleting}
                  onDelete={sheet.onDeleteClient}
                />
              ) : null}

              {sheet.cardTab === "istorija" ? (
                <ClientDetailTabAppointments detail={sheet.detail} />
              ) : null}

              {sheet.cardTab === "karton" ? (
                <ClientDetailTabChart
                  detail={sheet.detail}
                  kTitle={sheet.kTitle}
                  kNotes={sheet.kNotes}
                  kVisitAt={sheet.kVisitAt}
                  kApptId={sheet.kApptId}
                  kFiles={sheet.kFiles}
                  kError={sheet.kError}
                  kSaving={sheet.kSaving}
                  onKTitle={sheet.setKTitle}
                  onKNotes={sheet.setKNotes}
                  onKVisitAt={sheet.setKVisitAt}
                  onKApptId={sheet.setKApptId}
                  onKFiles={sheet.setKFiles}
                  onSubmit={sheet.onSaveKarton}
                  onDownloadFile={sheet.onDownloadFile}
                />
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
