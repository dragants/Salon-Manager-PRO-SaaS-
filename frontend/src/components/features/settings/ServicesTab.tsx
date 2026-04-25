import Link from "next/link";
import { useT } from "@/lib/i18n/locale";
import { ExternalLink } from "lucide-react";
import { SettingsCard } from "./SettingsCard";

export function ServicesTab() {
  const t = useT();
  return (
    <div className="space-y-6">
      <SettingsCard
        title={t.services.title}
        description="Naziv, cena, trajanje i buffer uređujete na posebnoj strani — brza lista i jasan tok."
      >
        <Link
          href="/services"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Otvori upravljanje uslugama
          <ExternalLink className="size-4 opacity-80" aria-hidden />
        </Link>
      </SettingsCard>
    </div>
  );
}
