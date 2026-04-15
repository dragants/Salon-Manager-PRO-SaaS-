# Salon Manager PRO (SaaS)

Sistem za upravljanje terminima, klijentima, uslugama i zaposlenima u salonima — sa javnim online zakazivanjem (`/book/{slug}`).

## Funkcije

- Kalendar i prevlačenje termina
- Online rezervacije za klijente (bez naloga)
- Klijenti, usluge, finansije
- Tim / radno vreme
- Kontrolna tabla i analitika
- Podsetnici (e-pošta / SMS / WhatsApp — po konfiguraciji)
- Pretplata (Paddle) — opciono

## Tehnologije

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend:** Node.js (Express)
- **Baza:** PostgreSQL

## Preduslovi

- Node.js (LTS)
- Docker Desktop (preporučeno za lokalni PostgreSQL) ili sopstvena PostgreSQL instanca

## Instalacija (lokalno)

1. Kloniraj repozitorijum i u korenu:

   ```bash
   npm install
   ```

2. PostgreSQL preko Docker Compose (iz korena projekta):

   ```bash
   docker compose up -d
   ```

3. Backend: kopiraj `backend/.env.example` u `backend/.env` i podesi `DATABASE_URL`, `JWT_SECRET`.

4. Pokretanje API-ja i frontenda jednim procesom:

   ```bash
   npm run dev
   ```

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - API: [http://localhost:5000](http://localhost:5000)

5. Produkcijski build (lokalni test):

   ```bash
   npm run start
   ```

   (Zahteva build frontenda: `npm run build --prefix frontend`.)

## Okruženje (primeri)

**Frontend** (`frontend/.env.local` — opciono):

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Na LAN-u, ako otvaraš aplikaciju kao `http://192.168.x.x:3000`, ostavi prazno ili koristi isti host za API; vidi `frontend/src/lib/api/api-base-url.ts`.

**Backend** (`backend/.env`): vidi `backend/.env.example`.

## Autentifikacija

JWT (Bearer token), sesija i zaštita ruta na API-ju; javne rute za booking pod odgovarajućim prefiksom.

## Pravno

U aplikaciji su javne stranice **Uslovi korišćenja**, **Politika privatnosti** i **Pretplata i naplata** (`/legal/terms`, `/legal/privacy`, `/legal/billing`). Za produkciju i obradu ličnih podataka uskladi tekst sa svojim pravnim obavezama (npr. GDPR).

## Licenca

MIT License © 2026 Dragan Saric — vidi fajl [LICENSE](./LICENSE).
