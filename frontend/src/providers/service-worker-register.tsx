"use client";

import { useEffect } from "react";

function shouldRegisterServiceWorker() {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (process.env.NODE_ENV === "production") return true;
  return process.env.NEXT_PUBLIC_ENABLE_SW === "true";
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!shouldRegisterServiceWorker()) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        reg.addEventListener("updatefound", () => {
          const w = reg.installing;
          if (w) {
            w.addEventListener("statechange", () => {
              if (w.state === "installed" && navigator.serviceWorker.controller) {
                /* nova verzija spremna — po želji kasnije: skipWaiting + reload */
              }
            });
          }
        });
      })
      .catch((e) => console.warn("Service worker registracija", e));
  }, []);

  return null;
}
