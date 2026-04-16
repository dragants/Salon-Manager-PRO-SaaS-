import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80",
        className
      )}
      {...props}
    />
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <Skeleton className="h-4 w-full max-w-[8rem]" />
        </td>
      ))}
    </tr>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
      <Skeleton className="h-6 w-3/5" />
      <Skeleton className="mt-4 h-8 w-2/5" />
      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
