import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politika privatnosti",
  description: "Politika privatnosti aplikacije Salon Manager PRO.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-zinc-800 dark:text-zinc-200">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Politika privatnosti
      </h1>
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          Prikupljamo i obrađujemo lične podatke u meri neophodnoj za rad
          aplikacije — npr. ime, kontakt telefon, e-adresa, podaci o terminima i
          klijentima koje unosi salon.
        </p>
        <p>
          Podaci se koriste radi zakazivanja, obaveštavanja (npr. podsetnici, ako
          su uključeni) i vođenja poslovanja salona, u skladu sa podešavanjima
          organizacije.
        </p>
        <p>
          Ne prodajemo lične podatke trećim licima. Deljenje sa procesorima
          (npr. hosting, e-pošta, SMS/WhatsApp provajderi) obavlja se samo ako
          ste takve usluge omogućili i u opsegu potrebnom za pružanje funkcije.
        </p>
        <p>
          Zadržavamo podatke dok postoji opravdan svrha ili dok to zakon ne
          zahteva drugačije. Korisnici salona mogu tražiti ispravku ili brisanje
          u granicama zakona i tehničkih mogućnosti.
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Za EU/EEA i slične režime (npr. GDPR) uskladite ovaj dokument sa
          obradom kod vas i sa podobrascima obrade — konsultujte stručnjaka.
        </p>
      </div>
      <p className="mt-10">
        <Link
          href="/"
          className="text-sm font-medium text-sky-800 underline-offset-4 hover:underline dark:text-sky-400"
        >
          Nazad na početnu
        </Link>
      </p>
    </div>
  );
}
