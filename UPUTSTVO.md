# Salon Manager PRO — kratko uputstvo

## Prijava i uloge

- **Prijava:** email i lozinka (`/login`). **Registracija** pravi salon (organizaciju) i prvog administratora.
- **Administrator:** pun pristup (finansije, smene, podešavanja…).
- **Radnik (worker):** kalendar, klijenti, usluge, analitika, nalog — **bez** finansija i stranice **Smena** (raspored smena). Stranica **Materijal** u meniju je samo za admina.

## Glavni meni (levo)

| Stranica | Šta radite |
|----------|------------|
| **Dashboard** | Pregled ključnih stvari i brzi uvod. |
| **Kalendar** | Termini po danu ili nedelji; filter statusa i pretraga; dodavanje termina; prevlačenje (nedelja); status (zakazano / završeno / nije došao). |
| **Smena** | Raspored radnog vremena po zaposlenima za automatske slobodne termine u modalu „Novi termin“. Posle izmena: **Sačuvaj smene**. |
| **Klijenti** | Evidencija klijenata. |
| **Usluge** | Usluge, trajanje, buffer; **izmena** (olovčica) i **brisanje** (korpa) — samo admin; brisanje nije moguće dok postoje termini za tu uslugu (prvo ih obriši ili promeni uslugu). |
| **Materijal** | *(samo admin)* Potrošni materijal — zalihe, nabavka, potrošnja po terminu, korekcije. |
| **Analitika** | Statistike i grafikoni (KPI). |
| **Finansije** | *(samo admin)* Evidencija prihoda/rashoda. |
| **Moj nalog** | Profil, lozinka, opciono push. |
| **Podešavanja** | Naziv salona, **vremenska zona**, **radno vreme** (otvaranje/zatvaranje po danima — utiče na sivo polje u kalendaru i na predloge termina), online rezervacije (kratak link), branding, **Loyalty** (program „N plaćenih završenih poseta iste usluge → jedna besplatna“), finansije, pretplata, itd. |

## Kalendar — praksa

- **Nedelja / Dan:** prekidač u zaglavlju; strelice i **Danas** za navigaciju.
- **Novi termin:** dugme za dodavanje; u modalu birate klijenta, uslugu, vreme; predlozi slotova po smenama i zauzeću. Ako za tu uslugu postoji aktivni **Loyalty** program i klijent ima nagradu, pojavi se opcija **iskorišćenja besplatne posete** (nagrada se knjiži kad termin pređe u **završeno**, ne pri samom zakazivanju).
- **Radno vreme u kalendaru:** belo = unutar podešenog radnog vremena salona; sivo = van tog opsega (termini se ipak mogu videti ako postoje).
- Ako nema predloga posle određenog sata: proverite **Podešavanja → radno vreme** i **Smena**.

## Klijenti — Loyalty

- Na kartici klijenta, tab **Loyalty** prikazuje pečate i broj dostupnih nagrada po programu (ako je program uključen u bazi).

## Loyalty (samo admin)

- **Podešavanja → Loyalty:** jedan aktivni program po **usluzi** — naziv, koliko završenih poseta treba za jednu nagradu, pauza ili brisanje programa.
- Obične posete (bez čekiranog iskorišćenja nagrade) nakon statusa **završeno** dodaju pečate; kada se skupi dovoljno pečata, formira se jedna **nagrada** (besplatna poseta te usluge).
- Zakazivanje sa **iskorišćenjem nagrade** smanjuje broj nagrada tek kad se termin označi kao **završeno**.

## Materijal — potrošnja (samo admin)

- **Materijal:** artikli sa jedinicom mere i trenutnom zalihom; unos **nabavke** (ulaz +), **potrošnje** (izlaz −) i **korekcija**.
- Potrošnja može biti vezana za završen termin radi evidencije.

## Online rezervacije (klijenti)

- U **Podešavanjima** uključite/ podesite **kratak link** (booking slug).
- Javni URL oblika: `/book/<slug>` — šaljete klijentima; ne zahteva njihov nalog u vašem panelu.

## Tehnička napomena (lokalno)

- Aplikacija: **frontend** (npr. port 3000) + **backend** (API, npr. 5000) + **PostgreSQL** (često preko `docker compose`).
- Prvi start baze: migracije u `backend/sql/migrations` po potrebi — iz foldera **backend**, npr.  
  `npm run migrate:sql -- sql/migrations/017_loyalty_programs.sql`  
  (vidi `backend/package.json` i `scripts/run-sql-migration.cjs`; u `.env` mora biti `DATABASE_URL`).

---

*Kratak vodič za korisnike salona; tehnički detalji deploya nisu ovde.*
