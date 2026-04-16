"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "smpro-theme";

function applyTheme(mode: "light" | "dark") {
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function getStoredOrSystemTheme(): "light" | "dark" {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      return stored;
    }
  } catch {
    /* ignore */
  }
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function setTheme(mode: "light" | "dark") {
  applyTheme(mode);
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

type ThemeToggleProps = {
  className?: string;
};

/** Prekidač teme — sinhronizovan sa `localStorage` ključem `smpro-theme`. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const mode = getStoredOrSystemTheme();
    applyTheme(mode);
    setDark(mode === "dark");

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      try {
        if (localStorage.getItem(STORAGE_KEY)) {
          return;
        }
      } catch {
        /* ignore */
      }
      const next = mq.matches ? "dark" : "light";
      applyTheme(next);
      setDark(next === "dark");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const next = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    setTheme(next);
    setDark(next === "dark");
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggle}
      className={cn(
        "size-10 rounded-xl border-border bg-card text-foreground shadow-sm hover:bg-muted",
        className
      )}
      aria-label={dark ? "Uključi svetli režim" : "Uključi tamni režim"}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export default ThemeToggle;
