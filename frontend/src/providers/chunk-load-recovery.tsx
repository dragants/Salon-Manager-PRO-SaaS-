"use client";

import { useEffect } from "react";

const STORAGE_KEY = "smpro-chunk-reload-once";

function isChunkFailureMessage(msg: string): boolean {
  return (
    msg.includes("ChunkLoadError") ||
    msg.includes("Loading chunk") ||
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed")
  );
}

/**
 * Posle restarta `next dev` ili Turbopack/Webpack zamene, tab često traži
 * stare `/_next/static/chunks/*` (404 + MIME text/plain) — jedno osvežavanje
 * obično učita novi manifest.
 */
export function ChunkLoadRecovery() {
  useEffect(() => {
    const tryReload = (msg: string) => {
      if (!isChunkFailureMessage(msg)) {
        return;
      }
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        return;
      }
      sessionStorage.setItem(STORAGE_KEY, "1");
      window.location.reload();
    };

    const onError = (e: ErrorEvent) => {
      const msg = e.message || (e.error instanceof Error ? e.error.message : "");
      tryReload(msg);
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      const msg =
        r instanceof Error ? r.message : typeof r === "string" ? r : "";
      tryReload(msg);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
