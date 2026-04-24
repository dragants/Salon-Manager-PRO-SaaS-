# Salon Manager PRO — Runda 4: Poboljšanja

## Primena
```bash
cd /path/to/Salon-Manager-PRO-SaaS-
git apply salon-manager-round4.patch
```

---

## 1. Booking page dekompozicija (973 → 289 linija, -70%)

Javna stranica za online rezervacije razbijen na 6 fokusiranih komponenti:

| Komponenta | Linija | Odgovornost |
|-----------|--------|-------------|
| `booking-shared.tsx` | 206 | Tipovi, konstante, WorkerAvatar, Stepper, ProgressBar |
| `StepSelectService.tsx` | 122 | Korak 1 — izbor usluge sa karticama |
| `StepSelectDate.tsx` | 99 | Korak 2 — brzi izbor + kalendar |
| `StepSelectSlot.tsx` | 150 | Korak 3 — grid slobodnih termina sa avatarima |
| `StepClientForm.tsx` | 190 | Korak 4 — forma + rezime + submit |
| `BookingSuccess.tsx` | 48 | Potvrda rezervacije |
| **page.tsx (novi)** | **289** | Data fetching + kompozicija koraka |

Svaki korak je sada nezavisno testabilan i može se menjati bez rizika od side-efekata.

---

## 2. Users rute — validacija parametara

Dodata `idParamSchema` (Joi) na sve `:id` rute u users modulu:

- `GET /users/:id` — sada validira da je `id` pozitivan integer
- `PATCH /users/:id` — dvostruka validacija (params + body)
- `DELETE /users/:id` — sprečava string injection u SQL query

Pre: 5/11 ruta validirano. Posle: **8/11** (preostale 3 su read-only `/me` rute bez parametara).

---

## 3. Konsolidacija DB helpera

- `backend/src/tenancy/db.js` sada re-exportuje iz `backend/src/utils/db.js`
- Eliminisana duplikacija `assertTenantId()` i `db()` funkcija
- Svi importi (`require("../tenancy/db")`) nastavljaju da rade

---

## 4. Novi testovi — 39 test cases (2 fajla)

### `rbac-permissions.test.js` (27 testova)
- `normalizeRole()` — svih 6 uloga + unknown/null/undefined
- Owner ima sve dozvole (verifikacija po PERM enumu)
- Admin ima specifičan subset dozvola
- Receptionist — može read/write appointments/clients, ne može delete/team
- Staff — samo 4 read dozvole, nijedna write
- Legacy `worker` → iste dozvole kao `staff`
- Hijerarhija uloga — owner ⊇ admin ⊇ receptionist ⊇ staff

### `users-validation.test.js` (12 testova)
- `idParamSchema` — pozitivan int, coercion, zero/negative/string rejection
- `createTeamMemberSchema` — email, password (min 8), role (admin/worker), display_name
- `changePasswordSchema` — current ≠ new password custom validator

---

## Statistika

| Metrika | Pre | Posle |
|---------|-----|-------|
| booking/page.tsx | 973 linija | 289 linija (-70%) |
| Booking komponenti | 0 | 6 |
| Users validacija | 5/11 ruta | 8/11 ruta |
| Backend testova (core) | 122 | 161 (+39) |
| DB helper fajlova | 2 (duplirani) | 1 + re-export |

---

## Šta je sledeće

1. **Frontend testovi** — Vitest setup + testovi za booking flow, formatMoney, i18n hook
2. **HTML email šabloni** — React Email za booking potvrdu sa cancel linkom
3. **Settings page split** (868 linija) — izvlačenje tab switching hook-a
4. **Clients route validacija** (6/8) — id params na GET/DELETE
5. **i18n wiring** — useTranslations() u app stranicama umesto hardkodiranih stringova
