import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <Tabs
        value={active}
        onValueChange={(id) => onChange(id as SettingsTabId)}
        className="w-full"
      >
        <TabsList
          aria-label="Odeljci podešavanja"
          className={cn(
            "h-auto min-h-0 w-full justify-start rounded-2xl p-1.5",
            "touch-pan-x lg:flex-wrap lg:overflow-x-visible"
          )}
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className={cn(
                "min-h-9 data-[state=active]:shadow-sm sm:min-h-10",
                "touch-pan-x"
              )}
            >
              <Icon className="size-3.5 shrink-0 sm:size-4" aria-hidden />
              <span className="whitespace-nowrap">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
