"use client";

import { useEffect, useRef } from "react";
import { getAppointments } from "@/lib/api";
import { addDays, formatYyyyMmDd, parseYyyyMmDd, todayLocal } from "@/lib/dateLocal";
import { notifyApp } from "@/lib/notifications-store";
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";

const DEFAULT_TZ = "Europe/Belgrade";

function todayYmdInTz(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Jednokratni podsetnik za termin ~1h unapred + jedan savet pri prvom učitavanju.
 */
export function NotificationsBootstrap() {
  const { user } = useAuth();
  const { settings } = useOrganization();
  const tipped = useRef(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    if (!tipped.current && !localStorage.getItem("salon_welcome_notif_tip")) {
      tipped.current = true;
      localStorage.setItem("salon_welcome_notif_tip", "1");
      notifyApp({
        title: "Centar za obaveštenja",
        body: "Ovde će se pojavljivati podsetnici za termine i važne događaje.",
        href: "/settings?tab=notify",
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const tz =
      settings?.timezone?.trim() && settings.timezone.trim().length > 0
        ? settings.timezone.trim()
        : DEFAULT_TZ;
    const day =
      tz === DEFAULT_TZ
        ? formatYyyyMmDd(todayLocal())
        : todayYmdInTz(tz);
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await getAppointments({ day, timezone: tz });
        if (cancelled || !Array.isArray(data)) {
          return;
        }
        const now = Date.now();
        for (const a of data) {
          if (a.status !== "scheduled") {
            continue;
          }
          const t = new Date(a.date).getTime();
          const diffMin = (t - now) / 60_000;
          if (diffMin < 50 || diffMin > 70) {
            continue;
          }
          const key = `salon_notified_appt_${a.id}_${day}`;
          if (sessionStorage.getItem(key)) {
            continue;
          }
          sessionStorage.setItem(key, "1");
          const who = a.client_name?.trim() || "Klijent";
          notifyApp({
            title: "Termin za oko 1 sat",
            body: `${who} — proveri kalendar.`,
            href: "/calendar",
          });
        }

        const tStr = formatYyyyMmDd(addDays(parseYyyyMmDd(day), 1));
        const { data: tData } = await getAppointments({
          day: tStr,
          timezone: tz,
        });
        if (cancelled || !Array.isArray(tData) || tData.length > 0) {
          return;
        }
        const dKey = `salon_empty_tomorrow_${tStr}`;
        if (sessionStorage.getItem(dKey)) {
          return;
        }
        sessionStorage.setItem(dKey, "1");
        notifyApp({
          title: "Sutra nema rezervacija",
          body: "Iskoristi dan za promociju ili pauzu — ili zakaži termin.",
          href: "/calendar",
        });
      } catch {
        /* mreža / backend */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, settings?.timezone]);

  return null;
}
