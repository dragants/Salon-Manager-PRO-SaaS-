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
        "size-10 rounded-xl border-white/25 bg-white/10 text-white shadow-sm backdrop-blur-sm hover:bg-white/20 hover:text-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100",
        className
      )}
      aria-label={dark ? "Uključi svetli režim" : "Uključi tamni režim"}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
