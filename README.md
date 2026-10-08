# OccasionWear

**Outfit booking & rental platform for Rwanda.**

OccasionWear is a full-stack outfit booking and rental application. Customers browse curated
occasion outfits, select an event date range, reserve an outfit, pay a deposit, receive the
outfit, wear it, and return it. Admin staff manage inventory, approve and track bookings,
inspect returns, and apply late or damage fees.

The frontend and backend are **two completely separate codebases** that communicate **only
through the documented REST API**.

---

## 1. Features

### Customer
- Browse curated occasion outfits with category / size / price / date-range filters —
  eight categories including the premium **Bridal Wedding Gowns**, **Civil Wedding Attire**
  and **Bridal Shower** collections
- Real availability checking against **overlapping bookings** (not just a status field)
- **Fixed rental pricing**: every outfit shows one fixed `Rental Price` for its whole
  `Rental Period` plus the `Refundable Deposit` — prices are never presented as a per-day
  rate and are never multiplied by the number of rental days
- **Fixed rental periods by category**: wedding wear (Bridal Wedding Gowns, Civil Wedding
  Attire, Wedding Guest) → **5 days**; every other outfit (Graduation, Traditional
  Ceremony, Bridal Shower, Photoshoot, Accessories) → **3 days**
- 4-step checkout: **Dates → Price Summary → Payment → Confirmation** (mock payment);
  customers pick only the start date and the expected return date is calculated automatically
- My Bookings with status badges, cancellation and return actions
- Register / login with JWT, customer profile page
- Email + SMS notifications (persisted in MySQL and logged to the backend console)

### Admin
- Branded dashboard: KPI cards, bookings-by-status chart, revenue-over-time chart
- Inventory management: search, filters, add / edit / retire outfits (soft delete)
- Booking management: filters, approve, confirm pickup, detail drawer
- Returns & inspection with a server-calculated fee preview: on-time returns are free,
  every day beyond the expected return date costs **2,000 RWF**
  (`GOOD_ON_TIME` / `LATE` / `DAMAGED`), with damage fees charged separately
- Reports page driven by `GET /api/admin/reports/summary`
- Repair or retire damaged outfits after inspection

### Platform
- JWT authentication + BCrypt password hashing + role-based authorization
- Consistent JSON error contract (`400 / 401 / 403 / 404 / 409 / 500`) — no stack traces
- Swagger / OpenAPI documentation
- Automatic database seeding (demo users, 57 outfits with real images, demo bookings)
- One pricing model everywhere: a **fixed total rental price** for the outfit's agreed
  rental period (5 days for wedding wear, 3 days for everything else) + a refundable
  deposit; a legacy-schema backfill migrates old `price_per_day` rows on startup
- Loading, empty and error states on every API-driven page
- Responsive, keyboard-accessible UI

---

## 2. Architecture

```text
React + TypeScript (Vite)
        ↓   REST API (JSON, JWT)
Spring Boot 3 (REST controllers → services → repositories)
        ↓   Spring Data JPA / Hibernate
MySQL (MariaDB) running through XAMPP
        └── database: occasionwear
```

```text
XAMPP
 └── MySQL
      └── occasionwear database

Spring Boot  ── connects to MySQL through JDBC/JPA
React        ── communicates with Spring Boot REST API only
```

> **XAMPP only provides MySQL + phpMyAdmin.** The backend is Java + Spring Boot — it is *not*
> PHP, and Apache is *not* required. React never talks to MySQL or phpMyAdmin directly; all
> database operations go through Spring Boot.

---

## 3. Technology stack

| Layer     | Technology |
|-----------|------------|
| Backend   | Java 17+, Spring Boot 3.x, Spring Web, Spring Data JPA, Spring Security, JWT (jjwt), Bean Validation, springdoc-openapi, Maven |
| Database  | MySQL via XAMPP (phpMyAdmin for management), Hibernate/JPA |
| Frontend  | React, Vite, TypeScript, Tailwind CSS, React Router, recharts |
| API       | REST (JSON) only — base URL `http://localhost:8080/api` |

---

## 4. Folder structure

```text
occasionwear/
│
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/occasionwear/
│       │   ├── config/        # Security, OpenAPI, DataSeeder
│       │   ├── controller/    # Thin REST controllers
│       │   ├── dto/           # Request/response payloads
│       │   ├── entity/        # JPA entities + enums
│       │   ├── exception/     # Error contract + global handler
│       │   ├── mapper/        # Entity → DTO mappers
│       │   ├── repository/    # Spring Data JPA repositories
│       │   ├── security/      # JWT service, filter, auth facade
│       │   ├── service/       # Business rules live here
│       │   └── OccasionWearApplication.java
│       └── resources/application.properties
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env                  # VITE_API_BASE_URL=http://localhost:8080/api
│   ├── public/images/        # Real outfit / hero / category imagery
│   └── src/
│       ├── components/  pages/  layouts/  services/
│       ├── hooks/       types/  utils/    context/
│       ├── routes/      assets/
│
├── scripts/fetch-images.mjs  # Regenerates the imagery in frontend/public/images
└── README.md
```

---

## 5. Prerequisites

- **JDK 17+** (any newer JDK works)
- **Maven 3.9+**
- **Node.js 18+** and npm
- **XAMPP** (for MySQL + phpMyAdmin)

---

## 6. XAMPP setup & MySQL database

1. Open **XAMPP**.
2. Start **MySQL** (Apache is optional — it is *not* needed for Spring Boot).
3. Open **phpMyAdmin** → <http://localhost/phpmyadmin>.
4. Create the database (SQL tab, or Import this):

```sql
CREATE DATABASE occasionwear;
```

   *(The backend also auto-creates the schema objects on first start via
   `spring.jpa.hibernate.ddl-auto=update`, but the database itself must exist.)*

5. Default local connection: host `localhost`, port `3306`, username `root`, **empty password**.

---

## 7. Backend setup

```bash
cd backend
mvn spring-boot:run
```

The API starts at **<http://localhost:8080>** and seeds demo data on first run.

### Database configuration

`backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/occasionwear?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC}
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
```

Every value can be overridden with environment variables (`DB_URL`, `DB_USERNAME`,
`DB_PASSWORD`, `JWT_SECRET`, …) — **no production credentials are hard-coded**.

---

## 8. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at **<http://localhost:5173>**.

`frontend/.env`:

```properties
VITE_API_BASE_URL=http://localhost:8080/api
```

The backend URL is read from this variable in one place
(`src/services/api.ts`) — it is never hard-coded throughout the React app.

> **How React communicates with Spring Boot:** every data access in the frontend goes through
> `src/services/` (`authService`, `outfitService`, `bookingService`, `adminService`), which
> call `fetch()` against `VITE_API_BASE_URL`. On login the API returns a JWT; the frontend
> stores it and sends it as `Authorization: Bearer <token>` on every request. There are no
> API routes, database drivers or proxies inside the frontend — only HTTP calls.

---

## 9. Running the whole project

Terminal 1:

```bash
cd backend
mvn spring-boot:run
```

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Then open <http://localhost:5173>.

---

## 10. Demo accounts

| Role     | Email               | Password  | Notes |
|----------|---------------------|-----------|-------|
| Customer | `customer@demo.com` | `Demo1234` | Staff role: — |
| Admin    | `admin@demo.com`    | `Demo1234` | Staff role: Manager |

Passwords are stored as **BCrypt hashes**. The catalogue seeds **57 outfits across eight
categories** (with real product photography in `frontend/public/images`), plus two demo
bookings (one COMPLETED with payment history, one CONFIRMED).

Every seeded price is a **fixed rental price for the whole rental period** — never a daily
rate — with a refundable deposit below the rental price. Bridal gowns are 700,000–1,500,000
RWF (5-day period), civil wedding attire 275,000–350,000 RWF (5-day period), bridal shower
150,000–210,000 RWF (3-day period — Bridal Shower is *not* wedding wear for the period
rule). Wedding Guest items are rented for 5 days and all other categories for 3 days.

---

## 11. API

- **API base URL:** `http://localhost:8080/api`
- **Swagger UI:** <http://localhost:8080/swagger-ui.html>
- **OpenAPI JSON:** <http://localhost:8080/v3/api-docs>

### Authentication
```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Customer
```http
GET  /api/outfits?category=&size=&minPrice=&maxPrice=&startDate=&endDate=
GET  /api/outfits/{id}
POST /api/bookings
GET  /api/bookings/my
POST /api/bookings/{id}/cancel
POST /api/bookings/{id}/pay
POST /api/bookings/{id}/return
```

### Admin (requires `ADMIN` role)
```http
GET   /api/admin/bookings?status=
PATCH /api/admin/bookings/{id}/approve
POST  /api/admin/bookings/{id}/pickup
GET   /api/admin/returns
POST  /api/admin/returns/{bookingId}/inspect
GET   /api/admin/outfits
POST  /api/admin/outfits
PUT   /api/admin/outfits/{id}
DELETE /api/admin/outfits/{id}          → sets status = RETIRED (never a hard delete)
GET   /api/admin/reports/summary
```

### Error contract
```json
{
  "timestamp": "2026-10-06T10:00:00",
  "status": 409,
  "error": "OUTFIT_UNAVAILABLE",
  "message": "This outfit is already booked for the selected dates."
}
```

`400` validation · `401` unauthenticated · `403` unauthorized · `404` not found ·
`409` business-rule conflict · `500` unexpected (stack traces are never exposed).

---

## 12. Main business rules

1. **Availability = overlapping bookings.** A booking is rejected if *any* blocking booking
   (`PENDING`, `CONFIRMED`, `ACTIVE`) overlaps the requested range, endpoints inclusive:
   an existing Dec 10 → Dec 15 booking rejects Dec 12 → 14, Dec 15 → 18 and Dec 5 → 10.
2. **Fixed rental period & price** — wedding outfits (Bridal Wedding Gowns, Civil Wedding
   Attire, Wedding Guest) are rented for **5 days**, every other outfit for **3 days**. The
   customer picks only a start date; the server derives the expected return date as
   `startDate + rentalPeriodDays` (a mismatching `endDate` is rejected with 400).
   The rental price is a **fixed total for that period** — never `days × price per day` — so
   **Booking creation** → `Outfit.status = RESERVED`, `Booking.status = PENDING`,
   `totalAmount = fixedRentalPrice + refundableDeposit`.
3. **Successful payment** → `Payment.status = PAID`, `Booking.status = CONFIRMED`,
   email + SMS notifications for the customer and the overseeing admin.
4. **Failed payment** → `Payment.status = FAILED`, `Booking.status = CANCELLED`,
   `Outfit.status = AVAILABLE` (released).
5. **Pickup (admin)** → `Booking.status = ACTIVE`, `Outfit.status = RENTED_OUT`.
6. **Return inspection (admin)**
   - `GOOD_ON_TIME` (returned on/before the expected return date) → outfit AVAILABLE,
     booking COMPLETED, **no fee**
   - **Late return — no grace allowance:**
     `chargeableLateDays = max(0, actualReturnDate - expectedReturnDate)` and
     `lateFee = chargeableLateDays × 2,000 RWF` (per-outfit `lateFeePerDay`, default from
     `occasionwear.fees.late-per-day`).
     Example (5-day wedding outfit): due 15 June → returned 18 June = 3 chargeable days =
     **6,000 RWF**; due 13 June → returned 15 June (3-day outfit) = 2 days = **4,000 RWF**.
     The outfit is **overdue and unavailable to others** from the day after the expected
     return date until inspection. Outfit AVAILABLE, booking COMPLETED.
   - `DAMAGED` → `Payment.applyDamageFee()`, plus the late fee when the return is also
     late (both fees can apply to one booking); outfit DAMAGED, booking
     COMPLETED; damaged outfits can later be repaired (→ AVAILABLE) or retired (→ RETIRED)
   - Late fees and damage fees are persisted separately on the booking's `Payment`, and
     `totalAmountDue = fixedRentalPrice + refundableDeposit + lateFee + damageFee`.
7. **Cancellation** → only `PENDING` or `CONFIRMED` bookings can be cancelled by the customer;
   then `Booking.status = CANCELLED`, `Outfit.status = AVAILABLE`, deposit refunded if paid.

All rules are enforced in the **service layer on the backend** — the frontend guards are
convenience only.

---

## 13. Images

All product, category and hero imagery lives in `frontend/public/images/` and is referenced
with **web paths only** (`/images/…`) — never Windows filesystem paths. The outfit
photography is user-supplied and named in kebab-case (e.g. `/images/gown-emerald-green-formal.jpg`);
every `Outfit.imageUrl` in the seed points at a file that actually exists there, and the UI
card falls back to a **branded placeholder with the outfit's name** if a URL ever breaks —
never a broken image or a gray box.

`scripts/fetch-images.mjs` only (re)generates `hero.jpg` from Unsplash; it deliberately does
not touch the catalog files so it can never overwrite real product images.

---

## 14. Troubleshooting

| Problem | Fix |
|---|---|
| Backend fails: `Communications link failure` | XAMPP → start **MySQL**. Check port 3306 and that the `occasionwear` database exists. |
| `Access denied for user 'root'` | Set `DB_PASSWORD` env var (XAMPP default is empty) or set a root password in phpMyAdmin and update `application.properties`. |
| Frontend shows "Cannot reach the server" | Start the backend (`mvn spring-boot:run`) on port 8080; check `VITE_API_BASE_URL` in `frontend/.env`. |
| CORS error in browser | Allowed origins are configured in `SecurityConfig` (`occasionwear.cors.allowed-origins`, default `http://localhost:5173,http://localhost:4173`). |
| `401` on protected endpoints | Token missing/expired — log in again. Swagger: use the **Authorize** button with the raw JWT (no `Bearer ` prefix). |
| Port already in use | Change `SERVER_PORT` (backend) or the Vite `server.port`. |
| Demo data missing | The seeder only runs on an empty table. Drop/recreate the `occasionwear` database and restart the backend. |
| Stale styles/classes after pulling changes | `cd frontend && rm -rf node_modules && npm install`. |

---

## 15. Verification performed

- `mvn compile` — backend builds cleanly (Java 17 target, Spring Boot 3.4).
- `mvn test` — **24 tests pass** across three suites:
  - `BookingPricingTest` (9): the spec's exact examples — a 700,000 RWF bridal gown booked
    from a start date returns exactly start + 5 days and charges 700,000 + 350,000 deposit
    (**not** × 5), a 180,000 RWF graduation suit returns start + 3 days and charges
    180,000 + 70,000 (**not** × 3), Bridal Shower gets 3 days (not 5), Wedding Guest gets
    5 days, an `endDate` outside the fixed period is rejected with 400, late inspection
    charges 2,000 RWF × extra days (3 days late → 6,000), on-time returns charge 0,
    late + damage fees both land in `totalAmountDue`, and the admin fee preview reports
    the outfit's period and per-day fee.
  - `LateFeePolicyTest` (9): no-grace fee table (on/before due → 0, day 1 → 2,000,
    day 2 → 4,000, day 3 → 6,000, day 5 → 10,000 RWF), chargeable days == overdue days,
    linear scaling with no free days, null-safety.
  - `RentalPeriodsTest` (6): wedding categories → 5 days, all others → 3 days,
    Bridal Shower explicitly NOT wedding wear, stored-period override + category fallback,
    default late fee 2,000 RWF.
- `npm run build` — TypeScript type check (`tsc --noEmit`) + Vite production build pass.
- Static consistency sweep: no `pricePerDay`, `RentalMode`, `/ day` price labels,
  grace-allowance wording or `days × price` maths remains anywhere in backend or frontend.
- Live API/browser E2E was not re-run in this environment (no local MySQL/XAMPP); run
  `mvn spring-boot:run` + `npm run dev` and click through checkout, My Bookings and the
  admin returns inspection to see the fixed-price flow end to end. On an existing database
  `LegacyPricingMigration` backfills `rental_price`, `rental_period_days` and
  `late_fee_per_day` from the old `price_per_day` rows on startup.
- Image/card pass (24 checks): desktop + mobile, every `<img>` loads, no fallback
  placeholders, no horizontal overflow.

---

*Images courtesy of [Unsplash](https://unsplash.com) contributors.*
