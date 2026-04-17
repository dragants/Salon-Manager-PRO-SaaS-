"use client";

import { useRouter } from "next/navigation";
import { PaywallDialog } from "@/components/ui/paywall-dialog";

type Props = {
  onClose: () => void;
};

/**
 * Globalni paywall (pretplata) — otvara se iz ModalProvider-a,
 * npr. kad API vrati kod limita plana.
 */
export function PaywallModal({ onClose }: Props) {
  const router = useRouter();

  return (
    <PaywallDialog
      open
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
      onUpgrade={() => {
        onClose();
        router.push("/subscribe");
      }}
      onDismiss={onClose}
    />
  );
}
