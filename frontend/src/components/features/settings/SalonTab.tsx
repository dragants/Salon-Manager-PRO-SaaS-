"use client";
import { useT } from "@/lib/i18n/locale";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TIMEZONE_OPTIONS } from "./constants";
import { SettingsCard } from "./SettingsCard";

type SalonTabProps = {
  saving: boolean;
  orgName: string;
  setOrgName: (v: string) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  logoUrl: string;
  setLogoUrl: (v: string) => void;
  instagram: string;
  setInstagram: (v: string) => void;
  themeColor: string;
  setThemeColor: (v: string) => void;
  timezone: string;
  setTimezone: (v: string) => void;
  bookingSlug: string;
  setBookingSlug: (v: string) => void;
  publicSiteUrl: string;
  setPublicSiteUrl: (v: string) => void;
  onSave: () => void;
};

function bookingBaseUrl(savedPublicUrl: string): string {
  const t = savedPublicUrl.trim().replace(/\/$/, "");
  if (t) {
    return t;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

export function SalonTab({
  saving,
  orgName,
  setOrgName,
  displayName,
  setDisplayName,
  phone,
  setPhone,
  address,
  setAddress,
  logoUrl,
  setLogoUrl,
  instagram,
  setInstagram,
  themeColor,
  setThemeColor,
  timezone,
  setTimezone,
  bookingSlug,
  setBookingSlug,
  publicSiteUrl,
  setPublicSiteUrl,
  onSave,
}: SalonTabProps) {
  const t = useT();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Osnovni podaci"
        description="Ime, kontakt i lokacija — vidljivo klijentima gde treba."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="org-name">Ime salona (pravno / interno)</Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="border-border bg-card"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="disp-name">Prikazno ime</Label>
            <Input
              id="disp-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border-border bg-card"
              placeholder="Kako klijenti vide salon"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border-border bg-card"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Adresa</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="border-border bg-card"
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Brending"
        description="Boja i logo utiču na izgled aplikacije. Logo za sada kao javni URL."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="logo">Logo (URL)</Label>
            <Input
              id="logo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="border-border bg-card"
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ig">Instagram</Label>
            <Input
              id="ig"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="border-border bg-card"
              placeholder="@salon ili puna adresa"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme">Primarna boja</Label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="theme"
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-md border border-border bg-card"
                aria-label="Izbor boje"
              />
              <Input
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="max-w-[10rem] border-border bg-card font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Online rezervacije"
        description="Javni link za klijente — biraju uslugu i slobodan termin bez naloga."
      >
        <div className="space-y-3 sm:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="booking-slug">Kratak link (samo mala slova, brojevi, crtice)</Label>
            <Input
              id="booking-slug"
              value={bookingSlug}
              onChange={(e) => setBookingSlug(e.target.value.toLowerCase())}
              className="border-border bg-card font-mono text-sm"
              placeholder="npr. salon-saric"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="public-site-url">
              Javna adresa aplikacije (kad je na internetu)
            </Label>
            <Input
              id="public-site-url"
              value={publicSiteUrl}
              onChange={(e) => setPublicSiteUrl(e.target.value)}
              className="border-border bg-card font-mono text-sm"
              placeholder="https://tvoj-domen.com"
              autoComplete="off"
              inputMode="url"
            />
            <p className="text-xs text-muted-foreground">
              Na lokalu može ostati prazno. Kada aplikacija bude na internetu,
              unesi punu adresu (npr.{" "}
              <span className="font-mono">https://app.tvoj-sajt.rs</span>) bez
              završnog <span className="font-mono">/</span>. Ispod vidiš link
              koji možeš poslati klijentima.
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <p className="text-xs text-muted-foreground">
              Stranica za deljenje:{" "}
              <span className="break-all font-mono text-foreground">
                {bookingSlug.trim() && bookingBaseUrl(publicSiteUrl)
                  ? `${bookingBaseUrl(publicSiteUrl)}/book/${bookingSlug.trim()}`
                  : bookingSlug.trim()
                    ? `/book/${bookingSlug.trim()}`
                    : "/book/…"}
              </span>
            </p>
            <p className="text-xs leading-relaxed text-amber-900/90">
              <strong>Telefon / drugi PC (ista Wi‑Fi):</strong> ovaj link mora
              koristiti <em>IP adresu računara</em> gde radi aplikacija (npr.{" "}
              <span className="font-mono">http://192.168.1.10:3000/book/…</span>
              ), ne <span className="font-mono">localhost</span>. Na Windowsu:
              <span className="font-mono"> ipconfig</span> → IPv4. Otvori portove
              3000 i 5000 u firewall-u za privatnu mrežu.
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong>Internet (mobilni podaci):</strong> lokalni PC nije
              dostupan — potreban je javni hosting (npr. VPS, Vercel + API) ili
              tunel (ngrok).
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Čarobnjak podešavanja"
        description="Ponovo pokreni uvodni tok — korisno posle preseljenja ili velikih promena u salonu."
      >
        <Button
          type="button"
          variant="outline"
          className="border-border bg-card  "
          onClick={() => {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("salon_onboarding_pending", "1");
            }
            router.push("/onboarding");
          }}
        >
          Ponovo podesi salon
        </Button>
      </SettingsCard>

      <SettingsCard
        title={t.settings.timezone}
        description="IANA zona za zakazivanje i podsetnike."
      >
        <div className="max-w-md space-y-2">
          <Label htmlFor="tz">Zona</Label>
          <Input
            id="tz"
            list="tz-list-settings"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="border-border bg-card"
          />
          <datalist id="tz-list-settings">
            {TIMEZONE_OPTIONS.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
        </div>
      </SettingsCard>

      <div className="flex justify-end border-t border-border/50 pt-4">
        <Button
          type="button"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={saving || !orgName.trim()}
          onClick={onSave}
        >
          {saving ? t.common.loading : t.common.save}
        </Button>
      </div>
    </div>
  );
}
