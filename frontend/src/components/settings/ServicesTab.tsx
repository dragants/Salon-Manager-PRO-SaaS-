import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { SettingsCard } from "./SettingsCard";

export function ServicesTab() {
  return (
    <div className="space-y-6">
      <SettingsCard
        title="Usluge"
        description="Naziv, cena, trajanje i buffer uređujete na posebnoj strani — brza lista i jasan tok."
      >
        <Link
          href="/services"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Otvori upravljanje uslugama
          <ExternalLink className="size-4 opacity-80" aria-hidden />
        </Link>
      </SettingsCard>
    </div>
  );
}
