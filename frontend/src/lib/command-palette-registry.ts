/**
 * Centralna konfiguracija stavki komandne palete (labela + ruta).
 * Ikone i JSX ostaju u `components/layout/command-palette.tsx`.
 */
export type CommandPaletteItemTemplate = {
  id: string;
  label: string;
  hint?: string;
  /** Relativna putanja aplikacije (Next.js `router.push`). */
  path: string;
  keywords?: string;
  requiresAdmin?: boolean;
};

function weekCalPath(todayYmd: string): string {
  return `/calendar?day=${encodeURIComponent(todayYmd)}&view=week`;
}

export function getCommandPaletteQuickActionTemplates(
  todayYmd: string,
  isAdmin: boolean
): CommandPaletteItemTemplate[] {
  const week = weekCalPath(todayYmd);
  const all: CommandPaletteItemTemplate[] = [
    {
      id: "add-client",
      label: "Dodaj klijenta",
      hint: "Formular za novog klijenta",
      path: "/clients?new=1",
      keywords: "novi kupac",
    },
    {
      id: "new-booking",
      label: "Nova rezervacija",
      hint: "Kalendar (nedeljni prikaz)",
      path: week,
      keywords: "termin zakazivanje booking",
    },
    {
      id: "new-service",
      label: "Nova usluga",
      hint: "Dodaj uslugu i cenu",
      path: "/services?new=1",
      keywords: "tretman cena trajanje",
      requiresAdmin: true,
    },
  ];
  return all.filter((a) => !a.requiresAdmin || isAdmin);
}

export function getCommandPaletteNavTemplates(
  todayYmd: string,
  isAdmin: boolean
): CommandPaletteItemTemplate[] {
  const week = weekCalPath(todayYmd);
  const items: CommandPaletteItemTemplate[] = [
    {
      id: "nav-clients",
      label: "Idi na Klijente",
      path: "/clients",
      keywords: "lista klijenata",
    },
    {
      id: "nav-calendar",
      label: "Idi na Kalendar",
      path: week,
      keywords: "raspored termini",
    },
  ];
  if (isAdmin) {
    items.push(
      {
        id: "nav-finances",
        label: "Idi na Finansije",
        path: "/finances",
        keywords: "prihod transakcije novac",
      },
      {
        id: "nav-supplies",
        label: "Idi na Potrošni materijal",
        path: "/supplies",
        keywords: "zalihe nabavka potrošnja inventura",
      }
    );
  }
  items.push({
    id: "nav-dashboard",
    label: "Idi na Dashboard",
    path: "/dashboard",
    keywords: "početna pregled",
  });
  return items;
}
