import { cn } from "@/lib/utils";
import type { SettingsTabConfig, SettingsTabId } from "./types";

type SettingsTabBarProps = {
  tabs: SettingsTabConfig[];
  active: SettingsTabId;
  onChange: (id: SettingsTabId) => void;
};

export function SettingsTabBar({
  tabs,
  active,
  onChange,
}: SettingsTabBarProps) {
  return (
    <div className="w-full min-w-0 max-w-full">
      <nav
        aria-label="Odeljci podešavanja"
        className={cn(
          "flex w-full min-w-0 flex-nowrap gap-1.5 overflow-x-auto overscroll-x-contain scroll-px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden",
          "rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900",
          "touch-pan-x lg:flex-wrap lg:overflow-x-visible lg:overscroll-x-auto lg:pb-0"
        )}
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(id)}
              className={cn(
                "flex min-h-9 shrink-0 snap-start items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors sm:min-h-10 sm:gap-2 sm:px-4 sm:text-sm",
                isActive
                  ? "bg-blue-600 text-white shadow-sm dark:bg-blue-600"
                  : "text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Icon
                className={cn(
                  "size-3.5 shrink-0 sm:size-4",
                  isActive ? "text-white/95" : "text-gray-500 dark:text-slate-500"
                )}
                aria-hidden
              />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
