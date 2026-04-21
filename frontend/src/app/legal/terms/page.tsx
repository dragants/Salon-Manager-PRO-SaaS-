import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Uslovi korišćenja",
  description: "Uslovi korišćenja aplikacije Salon Manager PRO.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-zinc-800">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground dark:text-zinc-50">
        Uslovi korišćenja
      </h1>
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          Korišćenjem ove aplikacije potvrđujete da ste upoznati sa ovim
          uslovima i da ih prihvatate u celini.
        </p>
        <p>
          Aplikacija je namenjena upravljanju terminima, klijentima i poslovnim
          podacima salona. Obavezni ste da koristite istinite podatke tamo gde je
          to potrebno i da ne zloupotrebljavate sistem.
        </p>
        <p>
          Pružalac ne garantuje neprekidan ili bezgrešan rad sistema. Održavanje,
          ažuriranja i dostupnost mogu biti povremeno ograničeni.
        </p>
        <p>
          Zadržavamo pravo da izmenimo ove uslove; nastavak korišćenja nakon
          objave izmeni smatra se prihvatanjem ažuriranog teksta.
        </p>
        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
          Ovaj tekst je informativan. Za pravno obavezujuće uslove u produkciji
          konsultujte pravnika.
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
