"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("smpro-theme");
      if (stored === "dark") {
        document.documentElement.classList.add("dark");
        setDark(true);
        return;
      }
      if (stored === "light") {
        document.documentElement.classList.remove("dark");
        setDark(false);
        return;
      }
    } catch {
      /* ignore */
    }
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
    try {
      localStorage.setItem("smpro-theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggle}
      className={cn(
        "size-10 rounded-xl border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
        className
      )}
      aria-label={dark ? "Uključi svetli režim" : "Uključi tamni režim"}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
