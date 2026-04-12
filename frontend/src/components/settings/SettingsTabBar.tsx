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
    <div className="w-full max-w-full">
      <div className="flex w-full min-w-0 flex-wrap gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white shadow-sm dark:bg-blue-600"
                  : "text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  isActive ? "text-white/95" : "text-gray-500 dark:text-slate-500"
                )}
                aria-hidden
              />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
