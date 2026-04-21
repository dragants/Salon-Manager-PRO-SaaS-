# Salon Manager PRO — roadmap (tehnički)

Kratak plan za stavke koje još nisu u kodu ili su samo delimično.

## Dashboard — keš i paralelni zahtevi

- **Status:** `@tanstack/react-query` (`QueryProvider`) + `useQueries` na `/dashboard` za `getDashboard`, `getAnalytics`, `getAppointments` (današnji dan).

## Skladištenje fajlova (S3 / MinIO)

- **Status:** fajlovi kartona u `BYTEA` / filesystem (`UPLOAD_ROOT`).
- **Sledeće:** env `STORAGE_DRIVER=local|s3`, `S3_BUCKET`, `S3_ENDPOINT` (MinIO), migracija koja čuva samo `key` + `mime` + `size` u bazi.

## Express 5

- **Status:** Express 4.
- **Sledeće:** kada izađe stabilna 5.x, planirati upgrade (bolji async error handling); pokrenuti regresione testove na rutama.

## Kalendar — drag & drop pomeranje termina

- **Status:** `@dnd-kit` se koristi za sortiranje; nedeljni grid nema DnD.
- **Sledeće:** u `WeekTimeGrid` omogućiti `pointer` drag na blok termina → `patchAppointment` sa novim `date` + ponovna `assertNoStaffScheduleOverlap` na backendu.

## View Transitions (pune)

- **Status:** u `globals.css` je `view-transition-name: root` gde browser podržava.
- **Sledeće:** eksperimentalno `next.config` / layout ako Next stabilizuje cross-document transitions za App Router.

## Zaposleni — avatar, bio, javna stranica

- **Status:** radnik kao email + inicijal.
- **Sledeće:** kolona `avatar_url`, `bio`, `specialties`; upload (isti storage kao prilozi); prikaz na `/book/[slug]`.

## Klijentski portal

- **Status:** nema klijentskog naloga.
- **Sledeće:** poseban auth flow (magic link), pregled termina, otkazivanje, loyalty stanje.

## HTML e-mail šabloni

- **Status:** plain text u delu mejlova.
- **Sledeće:** [React Email](https://react.email/) + brendirani layout (logo salona iz `settings`).

## i18n

- **Status:** `frontend/src/lib/i18n/sr.ts` kao izvor stringova za landing i dock; ostatak aplikacije postepeno.
- **Sledeće:** `en.ts`, `useTranslations()` ili sličan tanak sloj.

## Testovi

- **Status:** `backend/npm test` — unit test za `intervalOverlap`; proširiti na `auth.service`, booking overlap integracije.
- **Frontend:** dodati Vitest + testovi za kritične hook-ove / form validacije po potrebi.
