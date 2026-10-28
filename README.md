# Jua Kali API — Organ Donation App Consumer Contract

## Overview

The Jua Kali API lets an external application (the organ donation app) find **verified artisans** (skilled workers such as plumbers, electricians and hair stylists) together with their rates, and check whether an artisan has **accepted or declined** a booking. It is for developers building the organ donation app's integration, so a hospital can quickly find workers who are available and willing to do a job.

This README covers only the endpoints that integration uses. Jua Kali's internal endpoints (user management, reviews, creating bookings) are intentionally not documented here.

- **Base URL:** `http://localhost:3000` (if someone gave you a hosted URL, use that instead)
- **Format:** every response is JSON
- **Full contract:** [`openapi.yaml`](./openapi.yaml) (rendered docs: `<link-to-your-Swagger-UI-or-Redoc-page>`)

| Method | Path | Login needed? | Purpose |
|--------|------|---------------|---------|
| GET | `/api/artisans` | No | List artisans (verified only by default) |
| GET | `/api/artisans/{id}` | No | Details of one artisan |
| GET | `/api/bookings/{id}` | No | Full record of one booking |
| GET | `/api/bookings/{id}/status` | No | Only the status of one booking |
| PATCH | `/api/bookings/{id}/status` | Yes (artisan) | Artisan accepts / declines / completes their booking |

---

## Authentication

**The four `GET` endpoints are public. You need no token, key or cookie to call them.** If you only need to read artisans and booking statuses, skip to the Quickstart.

Only `PATCH /api/bookings/{id}/status` needs a login. It is the artisan's own action, so the organ donation app does not normally call it. To try it, log in as the demo artisan and save the session cookie to a file:

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"artisan@juakali.com","password":"Artisan123!"}'
```

Response — `200`:

```json
{
  "ok": true,
  "user": {
    "id": "u-artisan",
    "role": "artisan",
    "fullname": "Faith Wanjiru",
    "email": "artisan@juakali.com",
    "phone": "+254 700 000 003",
    "status": "active",
    "joined": "2024-02-14",
    "skill": "Hair Styling",
    "verified": true,
    "bio": "Braids, perms, treatments and cuts. 6 years experience, home visits available.",
    "rate": "From KES 500/style"
  }
}
```

The server sets a cookie named `connect.sid`, and `-c cookies.txt` saves it. Send it back on later requests with `-b cookies.txt`. The session lasts 7 days.

> The demo account above exists only in the local development data. Token-based auth is planned for Week 9; this section will be updated then.

---

## Quickstart

With the API running (see [Run the API locally](#run-the-api-locally)), open a **second terminal** and run:

```bash
curl "http://localhost:3000/api/artisans?verified=true"
```

Expected response — `200`:

```json
{
  "ok": true,
  "artisans": [
    {
      "id": "u-artisan",
      "fullname": "Faith Wanjiru",
      "phone": "+254 700 000 003",
      "skill": "Hair Styling",
      "verified": true,
      "bio": "Braids, perms, treatments and cuts. 6 years experience, home visits available.",
      "rate": "From KES 500/style"
    },
    {
      "id": "u-a3",
      "fullname": "Mercy Achieng",
      "phone": "+254 722 000 005",
      "skill": "Electrical",
      "verified": true,
      "bio": "Licensed electrician, wiring and fault-finding.",
      "rate": "From KES 500/hr"
    }
  ]
}
```

> **Windows users:** in PowerShell, type `curl.exe` instead of `curl` (plain `curl` is a different command there). In Command Prompt or PowerShell, JSON in `-d '...'` may need its quotes escaped as `\"`, for example `-d "{\"status\":\"upcoming\"}"`.

---

## Endpoint examples

The IDs below (`u-artisan`, `b1`, `b3`) come from the demo data that is created automatically the first time the server starts.

### 1. List artisans — `GET /api/artisans`

| Query parameter | Type | Required | Example | Meaning |
|-----------------|------|----------|---------|---------|
| `skill` | string | No | `Hair%20Styling` | Only artisans with this skill (not case sensitive) |
| `verified` | boolean | No | `false` | Defaults to `true`. Pass `verified=false` to list unverified artisans instead |

Results are sorted by `fullname`. Only artisans are returned (never customers or admins).

```bash
curl "http://localhost:3000/api/artisans?skill=Hair%20Styling"
```

Response — `200`:

```json
{
  "ok": true,
  "artisans": [
    {
      "id": "u-artisan",
      "fullname": "Faith Wanjiru",
      "phone": "+254 700 000 003",
      "skill": "Hair Styling",
      "verified": true,
      "bio": "Braids, perms, treatments and cuts. 6 years experience, home visits available.",
      "rate": "From KES 500/style"
    }
  ]
}
```

Notes:
- `phone`, `skill`, `bio` and `rate` can be `null`.
- `rate` is a text description of the price (for example `"From KES 500/style"`), not a number. There is no separate services or pricing endpoint.
- If nothing matches, you get `{ "ok": true, "artisans": [] }`.
- Email and account status are deliberately not included.

### 2. Get one artisan — `GET /api/artisans/{id}`

```bash
curl http://localhost:3000/api/artisans/u-artisan
```

Response — `200`:

```json
{
  "ok": true,
  "artisan": {
    "id": "u-artisan",
    "fullname": "Faith Wanjiru",
    "phone": "+254 700 000 003",
    "skill": "Hair Styling",
    "verified": true,
    "bio": "Braids, perms, treatments and cuts. 6 years experience, home visits available.",
    "rate": "From KES 500/style"
  }
}
```

Unknown ID — `404`:

```bash
curl http://localhost:3000/api/artisans/nope
```

```json
{ "ok": false, "error": "Artisan not found." }
```

### 3. Get one booking — `GET /api/bookings/{id}`

```bash
curl http://localhost:3000/api/bookings/b1
```

Response — `200`:

```json
{
  "ok": true,
  "booking": {
    "id": "b1",
    "customerId": "u-customer",
    "customerName": "Brian Otieno",
    "service": "Hair Styling",
    "artisanId": "u-artisan",
    "artisanName": "Faith Wanjiru",
    "date": "2026-07-14",
    "status": "upcoming",
    "price": "KES 500"
  }
}
```

Notes:
- `status` is one of `pending`, `upcoming`, `declined`, `completed`.
- `price` is text (for example `"KES 1,500"`) and can be `null`.
- This endpoint is public and includes `customerName`, a privacy question the team is still reviewing.

Unknown ID — `404`: `{ "ok": false, "error": "Booking not found." }`

### 4. Get only a booking's status — `GET /api/bookings/{id}/status`

Use this to check whether an artisan accepted or declined, without downloading the whole booking.

```bash
curl http://localhost:3000/api/bookings/b1/status
```

Response — `200`:

```json
{ "ok": true, "status": "upcoming" }
```

| Status | Meaning |
|--------|---------|
| `pending` | Artisan has not responded yet |
| `upcoming` | Artisan accepted; the job is scheduled |
| `declined` | Artisan declined |
| `completed` | Job finished |

Unknown ID — `404`:

```bash
curl http://localhost:3000/api/bookings/zzz/status
```

```json
{ "ok": false, "error": "Booking not found." }
```

### 5. Update a booking's status — `PATCH /api/bookings/{id}/status`

**Requires an artisan login** (see [Authentication](#authentication)), and the booking must belong to the logged-in artisan. **This changes data**: see the reset steps below to restore the demo data.

Body:

| Field | Type | Required | Allowed values |
|-------|------|----------|----------------|
| `status` | string | Yes | `upcoming`, `declined`, `completed` |

```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/bookings/b3/status \
  -H "Content-Type: application/json" \
  -d '{"status":"upcoming"}'
```

Response — `200`:

```json
{
  "ok": true,
  "booking": {
    "id": "b3",
    "customerId": "u-c2",
    "customerName": "Samuel Njoroge",
    "service": "Hair Styling",
    "artisanId": "u-artisan",
    "artisanName": "Faith Wanjiru",
    "date": "2026-07-17",
    "status": "upcoming",
    "price": "KES 500"
  }
}
```

---

## Error format

Every failed response has the same shape. The field is called `error` (not `message`):

```json
{ "ok": false, "error": "Booking not found." }
```

**To tell success from failure:** check `ok`, which is `true` on success and `false` on failure, or check the HTTP status code (`2xx` is success).

| HTTP code | When it happens | Real example |
|-----------|-----------------|--------------|
| `400` | Invalid `status` value in a PATCH | `{ "ok": false, "error": "Invalid status." }` |
| `401` | Not logged in, or logged in with the wrong role | `{ "ok": false, "error": "Not authorized." }` |
| `404` | Unknown artisan or booking ID, or a booking that belongs to a different artisan (PATCH) | `{ "ok": false, "error": "Booking not found." }` or `{ "ok": false, "error": "Artisan not found." }` |

---

## Run the API locally

**You need:** [Node.js](https://nodejs.org) (current LTS recommended) with npm, [git](https://git-scm.com), and a PostgreSQL database.

```bash
git clone https://github.com/VictorMuli7/-Team-1--Kazibuddy-app.git
cd ./-Team-1--Kazibuddy-app/server
npm install
```

Set `DATABASE_URL` to your PostgreSQL connection string before running the server. In PowerShell:

```powershell
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/juakali"
```

To preserve the existing SQLite records, migrate them once into an empty PostgreSQL database:

```bash
npm run migrate:sqlite
```

The migration reads `server/juakali.db` by default. To use a different SQLite file, pass its path:

```bash
npm run migrate:sqlite -- "C:\path\to\juakali.db"
```

The migration refuses to import into tables that already contain records. Back up the SQLite file and confirm `DATABASE_URL` points to the intended PostgreSQL database before running it. On Render, run this migration once with the service's internal database URL before starting the application.

Start the server:

```bash
npm start
```

> The folder name starts with a dash, so type `cd ./-Team-1--Kazibuddy-app/server` exactly as written (with the `./`). Without it, the terminal reads the name as an option and `cd` fails.

The server creates the PostgreSQL tables automatically and then prints:

```
Jua Kali server running at http://localhost:3000
```

Leave this terminal running and use a second terminal for the `curl` commands above. Existing demo users and records are available after migrating the existing SQLite database. A fresh PostgreSQL database starts without sample accounts; users can register through the app.

**Check that it works:**

```bash
curl http://localhost:3000/api/artisans
```

You should see JSON starting with `{"ok":true,"artisans":[`.

Changes are stored in PostgreSQL. To reset local test data, clear the PostgreSQL tables or use a separate development database; deleting the SQLite file does not reset PostgreSQL.

**Port already in use?** Start on another port: `PORT=3001 npm start` (macOS/Linux) or `$env:PORT=3001; npm start` (PowerShell), and use that port in the URLs.
