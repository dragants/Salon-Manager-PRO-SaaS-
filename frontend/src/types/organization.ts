export type BrandingSettings = {
  display_name: string;
  instagram: string;
};

export type CalendarRules = {
  min_gap_minutes: number;
  max_clients_per_hour: number;
  allow_overlap: boolean;
  buffer_between_minutes: number;
};

export type FinanceSettings = {
  currency: string;
  vat_enabled: boolean;
  accept_cash: boolean;
  accept_card: boolean;
};

export type AutomationSettings = {
  auto_confirm_booking: boolean;
  reminder_template: string;
  no_show_offer_new_slot: boolean;
};

/** Šta radnik sme; administrator uvek ima pun pristup. */
export type WorkerPermissions = {
  /** Brisanje klijenata i termina (API DELETE). Podrazumevano false. */
  can_delete: boolean;
};

export type BookingSmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from_email: string;
  from_name: string;
  /** Samo za prikaz — lozinka se ne vraća iz API-ja. */
  smtp_password_configured?: boolean;
};

export type BookingNotificationsSettings = {
  public_booking_sms: boolean;
  public_booking_email: boolean;
  public_booking_whatsapp?: boolean;
  smtp: BookingSmtpSettings;
  twilio_account_sid: string;
  twilio_from: string;
  twilio_configured?: boolean;
};

export type OrganizationSettings = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  working_hours: Record<string, unknown>;
  theme_color: string;
  logo: string | null;
  timezone: string | null;
  reminders: Record<string, unknown>;
  branding: BrandingSettings;
  calendar_rules: CalendarRules;
  finance: FinanceSettings;
  automation: AutomationSettings;
  worker_permissions: WorkerPermissions;
  /** Javna stranica /book/{slug}; null dok nije podešeno. */
  booking_slug?: string | null;
  /**
   * Javni URL aplikacije kada je na internetu (npr. https://app.tvoj-domen.com).
   * Lokalno može ostati prazno; koristi se za prikaz punog linka rezervacija.
   */
  public_site_url?: string | null;
  /** SMS / SMTP za javno zakazivanje. */
  booking_notifications?: BookingNotificationsSettings;
};
