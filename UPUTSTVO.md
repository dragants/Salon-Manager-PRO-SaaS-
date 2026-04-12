# Salon Manager PRO — kratko uputstvo

## Prijava i uloge- **Prijava:** email i lozinka (`/login`). **Registracija** pravi salon (organizaciju) i prvog administratora.
- **Administrator:** pun pristup (finansije, smene, podešavanja…).
- **Radnik (worker):** kalendar, klijenti, usluge, analitika, nalog — **bez** finansija i stranice **Smena** (raspored smena).

## Glavni meni (levo)

| Stranica | Šta radite |
|----------|------------|
| **Dashboard** | Pregled ključnih stvari i brzi uvod. |
| **Kalendar** | Termini po danu ili nedelji; filter statusa i pretraga; dodavanje termina; prevlačenje (nedelja); status (zakazano / završeno / nije došao). |
| **Smena** | Raspored radnog vremena po zaposlenima za automatske slobodne termine u modalu „Novi termin“. Posle izmena: **Sačuvaj smene**. |
| **Klijenti** | Evidencija klijenata. |
| **Usluge** | Usluge, trajanje, buffer; veza sa radnicima gde treba. |
| **Analitika** | Statistike i grafikoni (KPI). |
| **Finansije** | *(samo admin)* Evidencija prihoda/rashoda. |
| **Moj nalog** | Profil, lozinka, opciono push. |
| **Podešavanja** | Naziv salona, **vremenska zona**, **radno vreme** (otvaranje/zatvaranje po danima — utiče na sivo polje u kalendaru i na predloge termina), online rezervacije (kratak link), branding, itd. |

## Kalendar — praksa

- **Nedelja / Dan:** prekidač u zaglavlju; strelice i **Danas** za navigaciju.
- **Novi termin:** dugme za dodavanje; u modalu birate klijenta, uslugu, vreme; predlozi slotova po smenama i zauzeću.
- **Radno vreme u kalendaru:** belo = unutar podešenog radnog vremena salona; sivo = van tog opsega (termini se ipak mogu videti ako postoje).
- Ako nema predloga posle određenog sata: proverite **Podešavanja → radno vreme** i **Smena**.

## Online rezervacije (klijenti)

- U **Podešavanjima** uključite/ podesite **kratak link** (booking slug).
- Javni URL oblika: `/book/<slug>` — šaljete klijentima; ne zahteva njihov nalog u vašem panelu.

## Tehnička napomena (lokalno)

- Aplikacija: **frontend** (npr. port 3000) + **backend** (API, npr. 5000) + **PostgreSQL** (često preko `docker compose`).
- Prvi start baze: migracije u `backend/sql` po potrebi (`npm run migrate:sql` u backendu, vidi `backend/package.json` i `scripts/run-sql-migration.cjs`).

---

*Kratak vodič za korisnike salona; tehnički detalji deploya nisu ovde.*
