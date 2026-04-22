"use client";

import { CLIENT_DETAIL_TABS, type ClientDetailCardTab } from "./constants";
import { cn } from "@/lib/utils";

type ClientDetailTabBarProps = {
  active: ClientDetailCardTab;
  onChange: (tab: ClientDetailCardTab) => void;
};

export function ClientDetailTabBar({
  active,
  onChange,
}: ClientDetailTabBarProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border/90 pb-2">
      {CLIENT_DETAIL_TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
            active === t.id
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted dark:text-muted-foreground/70 dark:hover:bg-muted"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
