"use client";

/**
 * Modal = semantički alias iznad Dialog (isti Base UI sloj).
 * Koristi za potvrde, forme, pune ekrane — ne za paywall
 * (vidi `PaywallModal` u `components/features/billing` i `paywall-dialog`).
 */
export {
  Dialog as Modal,
  DialogPortal as ModalPortal,
  DialogOverlay as ModalOverlay,
  DialogTrigger as ModalTrigger,
  DialogClose as ModalClose,
  DialogContent as ModalContent,
  DialogHeader as ModalHeader,
  DialogFooter as ModalFooter,
  DialogTitle as ModalTitle,
  DialogDescription as ModalDescription,
} from "./dialog";
