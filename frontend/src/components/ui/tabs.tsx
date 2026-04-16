"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (v: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(consumer: string) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error(`${consumer} must be used within <Tabs>`);
  }
  return ctx;
}

export function Tabs({
  value,
  onValueChange,
  className,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const store = React.useMemo(
    () => ({ value, onValueChange }),
    [value, onValueChange]
  );
  return (
    <TabsContext.Provider value={store}>
      <div className={cn("w-full min-w-0", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex min-h-10 w-full min-w-0 flex-nowrap items-center gap-1 overflow-x-auto overscroll-x-contain rounded-2xl border border-border bg-card p-1.5 shadow-[var(--lux-shadow-soft)] [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1.5 [&::-webkit-scrollbar]:hidden",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  value,
  children,
  ...props
}: React.ComponentProps<"button"> & { value: string }) {
  const { value: active, onValueChange } = useTabsContext("TabsTrigger");
  const selected = active === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      data-state={selected ? "active" : "inactive"}
      className={cn(
        "inline-flex min-h-9 shrink-0 snap-start items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors sm:min-h-10 sm:gap-2 sm:px-4 sm:text-sm",
        selected
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  className,
  value,
  ...props
}: React.ComponentProps<"div"> & { value: string }) {
  const { value: active } = useTabsContext("TabsContent");
  if (active !== value) {
    return null;
  }
  return (
    <div
      role="tabpanel"
      data-state="active"
      className={cn("mt-4 outline-none", className)}
      {...props}
    />
  );
}
