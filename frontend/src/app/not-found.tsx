import Link from "next/link";
import { ArrowLeft, Home, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center bg-background px-4"
    >
      <div className="mx-auto max-w-md text-center">
        {/* Brand */}
        <div className="mx-auto mb-8 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="size-7 text-primary" aria-hidden />
        </div>

        {/* Error code */}
        <p className="text-6xl font-extrabold tabular-nums text-primary/30">
          404
        </p>

        <h1 className="mt-4 text-xl font-bold text-foreground">
          Stranica nije pronađena
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Izgleda da ova stranica ne postoji ili je premeštena.
          Proverite adresu ili se vratite na poznatu teritoriju.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "brand" }),
              "gap-2 rounded-xl no-underline"
            )}
          >
            <Home className="size-4" aria-hidden />
            Dashboard
          </Link>
          <Link
            href="/landing"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "gap-2 rounded-xl border-border no-underline"
            )}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Početna
          </Link>
        </div>
      </div>
    </div>
  );
}
