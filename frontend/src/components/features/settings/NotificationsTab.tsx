import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsCard } from "./SettingsCard";

type NotificationsTabProps = {
  saving: boolean;
  dayBefore: boolean;
  setDayBefore: (v: boolean) => void;
  twoHoursBefore: boolean;
  setTwoHoursBefore: (v: boolean) => void;
  dayBeforeHour: number;
  setDayBeforeHour: (v: number) => void;
  customReminderHours: number;
  setCustomReminderHours: (v: number) => void;
  channelSms: boolean;
  setChannelSms: (v: boolean) => void;
  channelWhatsApp: boolean;
  setChannelWhatsApp: (v: boolean) => void;
  channelEmail: boolean;
  setChannelEmail: (v: boolean) => void;
  noShowFollowup: boolean;
  setNoShowFollowup: (v: boolean) => void;
  autoConfirm: boolean;
  setAutoConfirm: (v: boolean) => void;
  reminderTemplate: string;
  setReminderTemplate: (v: string) => void;
  noShowOffer: boolean;
  setNoShowOffer: (v: boolean) => void;
  publicBookingSms: boolean;
  setPublicBookingSms: (v: boolean) => void;
  publicBookingEmail: boolean;
  setPublicBookingEmail: (v: boolean) => void;
  publicBookingWhatsApp: boolean;
  setPublicBookingWhatsApp: (v: boolean) => void;
  smtpHost: string;
  setSmtpHost: (v: string) => void;
  smtpPort: number;
  setSmtpPort: (v: number) => void;
  smtpSecure: boolean;
  setSmtpSecure: (v: boolean) => void;
  smtpUser: string;
  setSmtpUser: (v: string) => void;
  smtpPassword: string;
  setSmtpPassword: (v: string) => void;
  smtpPasswordConfigured: boolean;
  smtpFromEmail: string;
  setSmtpFromEmail: (v: string) => void;
  smtpFromName: string;
  setSmtpFromName: (v: string) => void;
  twilioSid: string;
  setTwilioSid: (v: string) => void;
  twilioToken: string;
  setTwilioToken: (v: string) => void;
  twilioFrom: string;
  setTwilioFrom: (v: string) => void;
  twilioConfigured: boolean;
  onSave: () => void;
};

export function NotificationsTab({
  saving,
  dayBefore,
  setDayBefore,
  twoHoursBefore,
  setTwoHoursBefore,
  dayBeforeHour,
  setDayBeforeHour,
  customReminderHours,
  setCustomReminderHours,
  channelSms,
  setChannelSms,
  channelWhatsApp,
  setChannelWhatsApp,
  channelEmail,
  setChannelEmail,
  noShowFollowup,
  setNoShowFollowup,
  autoConfirm,
  setAutoConfirm,
  reminderTemplate,
  setReminderTemplate,
  noShowOffer,
  setNoShowOffer,
  publicBookingSms,
  setPublicBookingSms,
  publicBookingEmail,
  setPublicBookingEmail,
  publicBookingWhatsApp,
  setPublicBookingWhatsApp,
  smtpHost,
  setSmtpHost,
  smtpPort,
  setSmtpPort,
  smtpSecure,
  setSmtpSecure,
  smtpUser,
  setSmtpUser,
  smtpPassword,
  setSmtpPassword,
  smtpPasswordConfigured,
  smtpFromEmail,
  setSmtpFromEmail,
  smtpFromName,
  setSmtpFromName,
  twilioSid,
  setTwilioSid,
  twilioToken,
  setTwilioToken,
  twilioFrom,
  setTwilioFrom,
  twilioConfigured,
  onSave,
}: NotificationsTabProps) {
  const t = useT();
  return (
    <div className="space-y-6">
      <SettingsCard
        title="Podsetnici"
        description="Šta šaljemo pre termina i u koje vreme. SMS i WhatsApp koriste Twilio / Meta iz backend .env ili Twilio ispod; e-mail koristi SMTP iz sekcije online rezervacije."
      >
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={dayBefore}
              onChange={(e) => setDayBefore(e.target.checked)}
              className="rounded border-border"
            />
            Podsetnik dan pre termina
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={twoHoursBefore}
              onChange={(e) => setTwoHoursBefore(e.target.checked)}
              className="rounded border-border"
            />
            Podsetnik ~2 h pre termina
          </label>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="dbh">Sat slanja „sutra imate termin“ (0–23)</Label>
            <Input
              id="dbh"
              type="number"
              min={0}
              max={23}
              value={dayBeforeHour}
              onChange={(e) =>
                setDayBeforeHour(Number.parseInt(e.target.value, 10) || 0)
              }
              className="border-border bg-card"
            />
          </div>
          <div className="max-w-sm space-y-2">
            <Label htmlFor="custom-h">Dodatni podsetnik pre termina</Label>
            <select
              id="custom-h"
              value={customReminderHours}
              onChange={(e) =>
                setCustomReminderHours(Number.parseInt(e.target.value, 10) || 0)
              }
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value={0}>Isključeno</option>
              <option value={3}>3 h pre</option>
              <option value={6}>6 h pre</option>
              <option value={12}>12 h pre</option>
              <option value={24}>24 h pre</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Za „24 h pre“ sistem šalje poruku u prozoru oko tačno 24 sata pre
              termina. Aktiviraj bar jedan kanal ispod; za e-mail uključi SMTP i
              e-mail na kartici klijenta.
            </p>
          </div>
          <p className="pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            Kanali
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={channelSms}
              onChange={(e) => setChannelSms(e.target.checked)}
              className="rounded border-border"
            />
            SMS (Twilio)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={channelWhatsApp}
              onChange={(e) => setChannelWhatsApp(e.target.checked)}
              className="rounded border-border"
            />
            WhatsApp (Meta Cloud API, .env)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={channelEmail}
              onChange={(e) => setChannelEmail(e.target.checked)}
              className="rounded border-border"
            />
            E-mail podsetnik (SMTP ispod)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={noShowFollowup}
              onChange={(e) => setNoShowFollowup(e.target.checked)}
              className="rounded border-border"
            />
            Poruka nakon no-show (follow-up)
          </label>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Online rezervacije (/book/…)"
        description="Šta se šalje klijentu odmah posle zakazivanja preko javnog linka. Podsetnici koriste podešavanja iznad (SMS / WhatsApp / e-mail)."
      >
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={publicBookingSms}
              onChange={(e) => setPublicBookingSms(e.target.checked)}
              className="rounded border-border"
            />
            Pošalji SMS potvrdu (Twilio)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={publicBookingEmail}
              onChange={(e) => setPublicBookingEmail(e.target.checked)}
              className="rounded border-border"
            />
            Pošalji e-mail potvrdu (SMTP ispod)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={publicBookingWhatsApp}
              onChange={(e) => setPublicBookingWhatsApp(e.target.checked)}
              className="rounded border-border"
            />
            Pošalji WhatsApp potvrdu (Meta{" "}
            <code className="rounded bg-muted px-1">WA_TOKEN</code> /{" "}
            <code className="rounded bg-muted px-1">WA_PHONE_ID</code> u .env)
          </label>
          <p className="text-xs text-muted-foreground">
            Ako ne popuniš Twilio ispod, koriste se{" "}
            <code className="rounded bg-muted px-1">TWILIO_*</code> iz backend
            .env. Za e-mail obavezno SMTP i adresa klijenta na formi za zakazivanje.
          </p>
          <p className="pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            Twilio (opciono, po salonu)
          </p>
          <div className="grid max-w-lg gap-3 sm:grid-cols-1">
            <div className="space-y-1.5">
              <Label htmlFor="bn-tw-sid">Account SID</Label>
              <Input
                id="bn-tw-sid"
                value={twilioSid}
                onChange={(e) => setTwilioSid(e.target.value)}
                className="border-border bg-card"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bn-tw-token">
                Auth token
                {twilioConfigured ? (
                  <span className="ml-2 font-normal text-muted-foreground/70">
                    (ostavi prazno da zadržiš postojeći)
                  </span>
                ) : null}
              </Label>
              <Input
                id="bn-tw-token"
                type="password"
                value={twilioToken}
                onChange={(e) => setTwilioToken(e.target.value)}
                className="border-border bg-card"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bn-tw-from">Broj / pošiljalac (Twilio)</Label>
              <Input
                id="bn-tw-from"
                value={twilioFrom}
                onChange={(e) => setTwilioFrom(e.target.value)}
                className="border-border bg-card"
                placeholder="+1…"
              />
            </div>
          </div>
          <p className="pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            SMTP (e-mail potvrda)
          </p>
          <div className="grid max-w-lg gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="smtp-host">Host</Label>
              <Input
                id="smtp-host"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="border-border bg-card"
                placeholder="smtp.example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  min={1}
                  max={65535}
                  value={smtpPort}
                  onChange={(e) =>
                    setSmtpPort(Number.parseInt(e.target.value, 10) || 587)
                  }
                  className="border-border bg-card"
                />
              </div>
              <label className="flex cursor-pointer items-end gap-2 pb-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={smtpSecure}
                  onChange={(e) => setSmtpSecure(e.target.checked)}
                  className="rounded border-border"
                />
                TLS (npr. port 465)
              </label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtp-user">Korisničko ime</Label>
              <Input
                id="smtp-user"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="border-border bg-card"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtp-pass">
                Lozinka
                {smtpPasswordConfigured ? (
                  <span className="ml-2 font-normal text-muted-foreground/70">
                    (ostavi prazno da zadržiš postojeću)
                  </span>
                ) : null}
              </Label>
              <Input
                id="smtp-pass"
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                className="border-border bg-card"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtp-from">From (e-mail)</Label>
              <Input
                id="smtp-from"
                type="email"
                value={smtpFromEmail}
                onChange={(e) => setSmtpFromEmail(e.target.value)}
                className="border-border bg-card"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtp-from-name">From (ime, opciono)</Label>
              <Input
                id="smtp-from-name"
                value={smtpFromName}
                onChange={(e) => setSmtpFromName(e.target.value)}
                className="border-border bg-card"
              />
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Automatika"
        description="Poruke pri zakazivanju i nakon nedolaska — kad provajder to podrži."
      >
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={autoConfirm}
              onChange={(e) => setAutoConfirm(e.target.checked)}
              className="rounded border-border"
            />
            Auto-potvrda novog zakazivanja
          </label>
          <div className="space-y-2">
            <Label htmlFor="tpl">Šablon teksta podsetnika (opciono)</Label>
            <textarea
              id="tpl"
              value={reminderTemplate}
              onChange={(e) => setReminderTemplate(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Zdravo {ime}, sutra u {vreme} imate termin za {usluga} ({datum}). Sat za „dan pre“: {sat}."
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={noShowOffer}
              onChange={(e) => setNoShowOffer(e.target.checked)}
              className="rounded border-border"
            />
            Predloži novi termin ako klijent ne dođe
          </label>
        </div>
      </SettingsCard>

      <div className="flex justify-end border-t border-border/50 pt-4">
        <Button
          type="button"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={saving}
          onClick={onSave}
        >
          {saving ? t.common.loading : t.common.save}
        </Button>
      </div>
    </div>
  );
}
