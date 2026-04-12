import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { appSurfaceClass } from "@/lib/app-ui";

type SurfaceCardProps = ComponentProps<"div"> & {
  padding?: "none" | "sm" | "md" | "lg";
};

const pad: Record<NonNullable<SurfaceCardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

/**
 * Jedinstvena „kartica“ za liste, tabele i panele (Linear/Stripe osećaj).
 */
export function SurfaceCard({
  className,
  padding = "md",
  ...props
}: SurfaceCardProps) {
  return (
    <div
      className={cn(appSurfaceClass, pad[padding], className)}
      {...props}
    />
  );
}
