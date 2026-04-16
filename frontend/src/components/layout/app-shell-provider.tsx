"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CommandPalette } from "@/components/layout/command-palette";

type AppShellContextValue = {
  openCommandPalette: () => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell(): AppShellContextValue | null {
  return useContext(AppShellContext);
}

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const openCommandPalette = useCallback(() => setCmdOpen(true), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AppShellContext.Provider value={{ openCommandPalette }}>
      {children}
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </AppShellContext.Provider>
  );
}
