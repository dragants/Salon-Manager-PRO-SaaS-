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
import { useAuth } from "@/providers/auth-provider";
import { toast } from "sonner";

function swReady(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    return Promise.reject(new Error("Service worker nije podržan."));
  }
  return navigator.serviceWorker.ready;
}

export function PushNotificationsCard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
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
      toast.error(
        isAdmin
          ? "VAPID ključevi nisu podešeni na serveru (pogledaj backend .env)."
          : "Push obaveštenja trenutno nisu omogućena. Obratite se administratoru salona."
      );
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
            ? isAdmin
              ? "Server nema VAPID ključeve (backend .env)."
              : "Push još nije podešen na sistemu. Kontaktiraj administratora salona."
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
      <h2 className="text-sm font-semibold text-foreground dark:text-slate-50">
        Push obaveštenja (PWA)
      </h2>
      <p className="text-xs text-muted-foreground">
        Na telefonu dodaj aplikaciju na početni ekran, zatim uključi obaveštenja.
        Radi u Chrome / Edge / Firefoxu; na iPhone-u potreban iOS 16.4+ i
        instalirana PWA. Obaveštenje o novoj online rezervaciji šalje se dodeljenom
        terapeutu (ako je na terminu izabran), inače administratorima salona.
      </p>
      {!supported ? (
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Ovaj pregledač ne podržava Web Push.
        </p>
      ) : vapidKey === undefined ? (
        <p className="text-xs text-muted-foreground">Učitavanje…</p>
      ) : vapidKey === null ? (
        <p className="text-xs text-amber-800 dark:text-amber-200">
          {isAdmin ? (
            <>
              Push zahteva VAPID ključeve na serveru. Generiši ih na mašini gde
              radi API (vidi{" "}
              <code className="rounded bg-muted px-1 dark:bg-card">
                backend/.env.example
              </code>
              ), zatim restartuj backend.
            </>
          ) : (
            <>
              Push obaveštenja na ovom sistemu još nisu uključena. Za pomoć se
              obratite vlasniku salona ili administratoru aplikacije.
            </>
          )}
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
