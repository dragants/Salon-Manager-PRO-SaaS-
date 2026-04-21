import { getApiBaseUrl } from "@/lib/api/api-base-url";

export type PublicSalonPayload = {
  salon: {
    name: string;
    phone: string | null;
    address: string | null;
    logo: string | null;
    timezone: string;
    /** Hex iz podešavanja salona (#rrggbb); za dinamički akcent na javnoj stranici. */
    theme_color?: string | null;
  };
  booking_notify?: {
    public_booking_sms: boolean;
    public_booking_email: boolean;
    public_booking_whatsapp?: boolean;
  };
  services: {
    id: number;
    name: string;
    price: string | number;
    duration: number;
    buffer_minutes: number;
  }[];
};

export type PublicSlot = {
  start: string;
  label: string;
  employee_id?: number;
  employee_name?: string;
};

export type PublicSlotsPayload = {
  slots: PublicSlot[];
  timezone: string;
  min_gap_minutes: number;
  /** Kad je true, svaki slot ima employee_id (smene u bazi). */
  from_shifts?: boolean;
};

export async function fetchPublicSalon(
  slug: string
): Promise<PublicSalonPayload> {
  const r = await fetch(
    `${getApiBaseUrl()}/public/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
    }
  );
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error || "Salon nije pronađen.");
  }
  return r.json() as Promise<PublicSalonPayload>;
}

export async function fetchPublicSlots(
  slug: string,
  params: { service_id: number; date: string; timezone: string }
): Promise<PublicSlotsPayload> {
  const q = new URLSearchParams({
    service_id: String(params.service_id),
    date: params.date,
    timezone: params.timezone,
  });
  const r = await fetch(
    `${getApiBaseUrl()}/public/${encodeURIComponent(slug)}/slots?${q}`,
    { cache: "no-store" }
  );
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error || "Nije moguće učitati termine.");
  }
  return r.json() as Promise<PublicSlotsPayload>;
}

export async function postPublicBook(
  slug: string,
  body: {
    name: string;
    phone: string;
    email?: string;
    service_id: number;
    start: string;
    timezone: string;
    staff_user_id?: number;
  }
): Promise<{
  ok: boolean;
  appointment_id: number;
  notify: Record<string, string>;
}> {
  const r = await fetch(
    `${getApiBaseUrl()}/public/${encodeURIComponent(slug)}/book`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(
      (j as { error?: string }).error || "Rezervacija nije uspela."
    );
  }
  return j as {
    ok: boolean;
    appointment_id: number;
    notify: Record<string, string>;
  };
}
