"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

/** @deprecated Prefer `ThemeToggle` iz `@/components/theme-toggle`. */
export function DashboardThemeToggle({ className }: { className?: string }) {
  return <ThemeToggle className={className} />;
}
