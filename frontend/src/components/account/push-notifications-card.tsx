"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPushConfig,
  sendPushTest,
  subscribePush,
  unsubscribePush,
} from "@/lib/api";
import { applicationServerKeyFromVapidBase64 } from "@/lib/web-push";
import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { toast } from "sonner";

function swReady(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    return Promise.reject(new Error("Service worker nije podržan."));
  }
  return navigator.serviceWorker.ready;
}

export function PushNotificationsCard() {
  const [vapidKey, setVapidKey] = useState<string | null | undefined>(undefined);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const refreshLocalSubscription = useCallback(async () => {
    try {
      const reg = await swReady();
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(Boolean(sub));
    } catch {
      setSubscribed(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await getPushConfig();
        setVapidKey(data.vapid_public_key ?? null);
      } catch {
        setVapidKey(null);
      }
      await refreshLocalSubscription();
    })();
  }, [refreshLocalSubscription]);

  async function onEnable() {
    if (!vapidKey) {
      toast.error("VAPID ključevi nisu podešeni na serveru.");
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.message("Obaveštenja nisu odobrena.");
        return;
      }
      const reg = await swReady();
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKeyFromVapidBase64(vapidKey),
        });
      }
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Neispravna pretplata.");
      }
      await subscribePush({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        expirationTime: json.expirationTime ?? null,
      });
      setSubscribed(true);
      toast.success("Push obaveštenja su uključena na ovom uređaju.");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Pretplata nije uspela."
      );
    } finally {
      setBusy(false);
    }
  }

  async function onDisable() {
    setBusy(true);
    try {
      const reg = await swReady();
      const sub = await reg.pushManager.getSubscription();
      const endpoint = sub?.endpoint ?? null;
      if (sub) {
        await sub.unsubscribe();
      }
      await unsubscribePush(endpoint);
      setSubscribed(false);
      toast.success("Pretplata je uklonjena.");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Isključivanje nije uspelo."
      );
    } finally {
      setBusy(false);
    }
  }

  async function onTest() {
    setBusy(true);
    try {
      const { data } = await sendPushTest();
      if (data.sent > 0) {
        toast.success("Proba poslata.");
      } else {
        toast.message(
          data.skipped === "vapid"
            ? "Server nema VAPID ključeve."
            : "Nema aktivne pretplate na ovom nalogu — prvo uključi obaveštenja."
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Proba nije uspela.");
    } finally {
      setBusy(false);
    }
  }

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  return (
    <SurfaceCard padding="md" className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
        Push obaveštenja (PWA)
      </h2>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Na telefonu dodaj aplikaciju na početni ekran, zatim uključi obaveštenja.
        Radi u Chrome / Edge / Firefoxu; na iPhone-u potreban iOS 16.4+ i
        instalirana PWA. Poruke o novoj online rezervaciji idu dodeljenom radniku
        (ako postoji), inače administratorima salona — podešava se na backendu.
      </p>
      {!supported ? (
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Ovaj pregledač ne podržava Web Push.
        </p>
      ) : vapidKey === undefined ? (
        <p className="text-xs text-slate-500">Učitavanje…</p>
      ) : vapidKey === null ? (
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Administrator mora generisati VAPID ključeve na backendu (vidi{" "}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">
            .env.example
          </code>
          ).
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {!subscribed ? (
            <Button
              type="button"
              variant="brand"
              className="touch-manipulation"
              disabled={busy}
              onClick={() => void onEnable()}
            >
              Uključi obaveštenja
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="touch-manipulation"
              disabled={busy}
              onClick={() => void onDisable()}
            >
              Isključi na ovom uređaju
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            className="touch-manipulation"
            disabled={busy || !subscribed}
            onClick={() => void onTest()}
          >
            Pošalji probnu notifikaciju
          </Button>
        </div>
      )}
    </SurfaceCard>
  );
}
