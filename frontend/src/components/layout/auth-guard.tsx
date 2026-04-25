"use client";
import { useT } from "@/lib/i18n/locale";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

const LOADING_HINT_MS = 8000;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const t = useT();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showSlowHint, setShowSlowHint] = useState(false);

  useEffect(() => {
    if (loading) {
      const t = window.setTimeout(() => setShowSlowHint(true), LOADING_HINT_MS);
      return () => {
        window.clearTimeout(t);
      };
    }
    setShowSlowHint(false);
    return undefined;
  }, [loading]);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    const label = loading ? t.common.loading : "Preusmeravanje na prijavu…";
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 bg-background p-8 text-center text-sm text-zinc-800">
        <Loader2
          className="size-8 animate-spin text-muted-foreground dark:text-muted-foreground/70"
          aria-hidden
        />
        <p className="font-medium">{label}</p>
        {showSlowHint ? (
          <p className="max-w-md text-xs text-muted-foreground dark:text-muted-foreground/70">
            Ako ovo traje predugo: pokreni backend (
            <span className="font-mono">npm run dev</span> u{" "}
            <span className="font-mono">backend</span>, port 5000,{" "}
            <span className="font-mono">HOST=0.0.0.0</span>). Ako otvaraš app
            preko LAN IP-a (npr. <span className="font-mono">192.168…</span>),
            u <span className="font-mono">frontend/.env.local</span> obriši ili
            ispravi <span className="font-mono">NEXT_PUBLIC_API_URL</span> ako
            pokazuje na <span className="font-mono">localhost</span>. Proveri u
            konzoli mrežne greške (F12 → Network) ka API-ju.
          </p>
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
}
