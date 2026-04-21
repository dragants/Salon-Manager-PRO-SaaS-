"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { syncSessionCookie } from "@/lib/auth/session-cookie";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (user) {
      syncSessionCookie(true);
      router.replace("/dashboard");
    } else {
      router.replace("/landing");
    }
  }, [router, loading, user]);

  return (
    <div
      id="main-content"
      className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-[#f8fafc]"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="size-10 animate-pulse rounded-2xl bg-sky-200/80 dark:bg-sky-900/50"
          aria-hidden
        />
        <p className="text-sm font-medium text-muted-foreground">
          Učitavanje…
        </p>
      </div>
    </div>
  );
}
