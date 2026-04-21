import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pretplata i naplata",
  description:
    "Uslovi pretplate, naplate i povraćaja sredstava — Salon Manager PRO.",
};

export default function BillingLegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-foreground">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Pretplata, naplata i povraćaj
      </h1>
      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            Pretplata i plaćanje
          </h2>
          <p>
            Ako koristite plaćenu verziju aplikacije, pretplata se obračunava u
            skladu sa ponudom prikazanom u aplikaciji ili na stranici za
            naplatu. Cene, porezi i valuta mogu zavisiti od regiona i načina
            plaćanja (npr. kartica) koje obrađuje platni procesor (npr. Paddle
            ili drugi pružalac koga koristi operater sistema).
          </p>
          <p>
            Nastavak korišćenja nakon isteka probnog perioda ili obnove
            pretplate podrazumeva da ste saglasni sa trenutnim cenama i uslovima
            prikazanim u trenutku kupovine.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            Obnova i otkazivanje
          </h2>
          <p>
            Pretplate se mogu automatski obnavljati do momenta kada ih otkažete
            preko mehanizma koji je dostupan u aplikaciji ili kod platnog
            pružaoca (npr. link za upravljanje pretplatom). Otkazivanje ne
            utiče uvek na već naplaćeno razdoblje — pristup funkcijama može
            ostati aktivan do krava već plaćenog perioda, u skladu sa tehničkim
            podešavanjem sistema.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            Povraćaj sredstava (refund)
          </h2>
          <p>
            Zahtevi za povraćaj novca razmatraju se u skladu sa važećim zakonima
            i politikom platnog procesora. Uobičajeno je da se reklamacije
            podnose u razumnom roku od transakcije, uz dokaz o plaćanju.
            Odluku o delimičnom ili punom povraćaju donosi operater u dogovoru sa
            pravilima procesora plaćanja.
          </p>
          <p>
            Ako ste u sporu oko naplate, prvo koristite kanal podrške naveden od
            strane operatera ili u podešavanjima naloga.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            Izmene cena i uslova
          </h2>
          <p>
            Zadržavamo pravo da unapred obavestimo o promeni cena ili strukture
            paketa. Nastavak korišćenja nakon stupanja na snagu izmena može se
            smatrati prihvatanjem, osim ako je drugačije propisano zakonom ili
            ugovorom sa vama.
          </p>
        </section>

        <p className="text-xs text-muted-foreground">
          Ovaj tekst je informativan i treba ga uskladiti sa stvarnim procesom
          naplate (Paddle, ugovor, jurisdikcija). Za obavezujuće formulacije
          konsultujte pravnika.
        </p>
      </div>
      <p className="mt-10 flex flex-wrap gap-x-4 gap-y-2">
        <Link
          href="/subscribe"
          className="text-sm font-medium text-sky-800 underline-offset-4 hover:underline dark:text-sky-400"
        >
          Stranica pretplate
        </Link>
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
