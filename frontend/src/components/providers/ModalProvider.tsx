"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PaywallModal } from "@/components/features/billing/PaywallModal";

/** Poznati modali po imenu (proširuj po potrebi). */
export type AppModalName = "paywall";

type ModalContextValue = {
  /** Trenutno otvoren modal ili `null`. */
  open: AppModalName | null;
  setOpen: (name: AppModalName | null) => void;
  close: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState<AppModalName | null>(null);

  const setOpen = useCallback((name: AppModalName | null) => {
    setOpenState(name);
  }, []);

  const close = useCallback(() => {
    setOpenState(null);
  }, []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      close,
    }),
    [open, setOpen, close]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      {open === "paywall" ? <PaywallModal onClose={close} /> : null}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModal mora biti unutar ModalProvider.");
  }
  return ctx;
}
