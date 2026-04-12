import { useEffect, useRef } from "react";
import { getToken } from "@/lib/auth/token";
import { getApiBaseUrl } from "@/lib/api/api-base-url";

/** Telo SSE poruke sa `/appointments/stream` (server: `type` + `event` + `payload`). */
export type AppointmentSseMessage = {
  type?: string;
  event?: string;
  payload?: unknown;
  id?: number;
  source?: string;
};

/**
 * SSE na `/appointments/stream` (token u query — EventSource ne šalje Authorization).
 * Prosleđuje parsiran JSON u `onMessage` (npr. NEW_APPOINTMENT / UPDATE_APPOINTMENT / DELETE_APPOINTMENT).
 */
export function useAppointmentsSse(
  enabled: boolean,
  onMessage: (data: AppointmentSseMessage) => void
) {
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }
    const token = getToken();
    if (!token) {
      return;
    }

    const url = `${getApiBaseUrl()}/appointments/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onmessage = (ev) => {
      if (!ev.data) {
        return;
      }
      try {
        const p = JSON.parse(ev.data) as AppointmentSseMessage;
        onMessageRef.current(p);
      } catch {
        onMessageRef.current({ type: "appointments", event: "SYNC" });
      }
    };

    return () => {
      es.close();
    };
  }, [enabled]);
}
