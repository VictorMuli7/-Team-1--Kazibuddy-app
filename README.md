# Jua Kali API — Organ Donation App Consumer Contract

## Overview

The Jua Kali API lets an external application (the organ donation app) find **verified artisans** (skilled workers such as plumbers, electricians and hair stylists) together with their rates, and check whether an artisan has **accepted or declined** a booking. It is for developers building the organ donation app's integration, so a hospital can quickly find workers who are available and willing to do a job.

This README covers only the endpoints that integration uses. Jua Kali's internal endpoints (user management, reviews, creating bookings) are intentionally not documented here.

- **Base URL:** `http://localhost:3000` (if someone gave you a hosted URL, use that instead)
- **Format:** every response is JSON
- **Full contract:** [`openapi.yaml`](./openapi.yaml) (rendered docs: `<link-to-your-Swagger-UI-or-Redoc-page>`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/artisans` | API key | List artisans (verified only by default) |
| GET | `/api/artisans/{id}` | API key | Details of one artisan |
| GET | `/api/bookings/{id}` | API key | Full record of one booking |
| GET | `/api/bookings/{id}/status` | API key | Only the status of one booking |
| PATCH | `/api/bookings/{id}/status` | Website key + artisan login | Artisan accepts / declines / completes their booking |

---

## Authentication and rate limits

**Every request needs an API key**, sent in the `X-API-Key` header. Each consumer is given its own key, so one can be revoked without breaking the others. You get yours privately from the Jua Kali team; never put it in a public repo or in browser code, and call the API from your server.

```bash
curl -H "X-API-Key: <your-api-key>" https://team-1-kazibuddy-app.onrender.com/api/artisans
```

The only open endpoint is `GET /api/health`, a liveness check that returns `{ "ok": true }` and no data.

| Status | Meaning | Body |
|--------|---------|------|
| `401` | The key is missing or wrong (the same message for both) | `{ "ok": false, "error": "Missing or invalid API key." }` |
| `403` | Valid key, but its scope doesn't allow this endpoint. Partner keys only work on the four `GET` endpoints below | `{ "ok": false, "error": "This API key is not allowed to use this endpoint." }` |
| `429` | You went over your rate limit | `{ "ok": false, "error": "Too many requests. Please slow down.", "retryAfter": 42 }` |

**Rate limit: 100 requests per minute per key.** Every response carries `X-RateLimit-Limit` and `X-RateLimit-Remaining`. A `429` also carries a `Retry-After` header (seconds): wait that long, then try again. A loop that retries immediately will stay blocked.

`PATCH /api/bookings/{id}/status` is different: it is the artisan's own action from the Jua Kali website (it needs the website's key **and** a login), so the organ donation app does not call it. To try it, log in as the demo artisan and save the session cookie to a file:

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
curl -H "X-API-Key: <your-api-key>" "http://localhost:3000/api/artisans?verified=true"
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
curl -H "X-API-Key: <your-api-key>" "http://localhost:3000/api/artisans?skill=Hair%20Styling"
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
curl -H "X-API-Key: <your-api-key>" http://localhost:3000/api/artisans/u-artisan
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
curl -H "X-API-Key: <your-api-key>" http://localhost:3000/api/artisans/nope
```

```json
{ "ok": false, "error": "Artisan not found." }
```

### 3. Get one booking — `GET /api/bookings/{id}`

```bash
curl -H "X-API-Key: <your-api-key>" http://localhost:3000/api/bookings/b1
```

Response — `200`:

```json
{
  "ok": true,
  "booking": {
    "id": "b1",
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
- This record deliberately contains **no customer details** (no `customerId` or `customerName`). The organ donation app only needs to know whether the artisan accepted, and the customer's identity is not its business.

Unknown ID — `404`: `{ "ok": false, "error": "Booking not found." }`

### 4. Get only a booking's status — `GET /api/bookings/{id}/status`

Use this to check whether an artisan accepted or declined, without downloading the whole booking.

```bash
curl -H "X-API-Key: <your-api-key>" http://localhost:3000/api/bookings/b1/status
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
curl -H "X-API-Key: <your-api-key>" http://localhost:3000/api/bookings/zzz/status
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
| `401` | Missing or invalid API key; or (website endpoints) not logged in, or the wrong role | `{ "ok": false, "error": "Missing or invalid API key." }` or `{ "ok": false, "error": "Not authorized." }` |
| `403` | Valid key, wrong scope for this endpoint | `{ "ok": false, "error": "This API key is not allowed to use this endpoint." }` |
| `429` | Rate limit exceeded (see `Retry-After`) | `{ "ok": false, "error": "Too many requests. Please slow down.", "retryAfter": 42 }` |
| `404` | Unknown artisan or booking ID, or a booking that belongs to a different artisan (PATCH) | `{ "ok": false, "error": "Booking not found." }` or `{ "ok": false, "error": "Artisan not found." }` |

---

## Run the API locally

**You need:** [Node.js](https://nodejs.org) (current LTS recommended) with npm, [git](https://git-scm.com), and a [PostgreSQL](https://www.postgresql.org/download/) server (v13 or newer) running locally or hosted.

**1. Create the database** (once):

```bash
createdb juakali
```

(or, from `psql`: `CREATE DATABASE juakali;`)

**2. Install and configure:**

```bash
git clone https://github.com/VictorMuli7/-Team-1--Kazibuddy-app.git
cd ./-Team-1--Kazibuddy-app/server
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```

Open `server/.env` and set:

- `DATABASE_URL`: your PostgreSQL connection string (format `postgres://USER:PASSWORD@HOST:PORT/DATABASE`). For a hosted database that requires SSL, also set `DATABASE_SSL=true`.
- `API_KEYS`: at least one key, see [API keys](#api-keys-for-the-people-running-the-server) below. For local testing you can use short made-up keys such as `API_KEYS=me:partner:test-partner-key,site:web:test-web-key`.

**3. Start the server:**

```bash
npm start
```

> The folder name starts with a dash, so type `cd ./-Team-1--Kazibuddy-app/server` exactly as written (with the `./`). Without it, the terminal reads the name as an option and `cd` fails.

You should see:

```
Database seeded with initial demo data.
Jua Kali server running at http://localhost:3000
Database: PostgreSQL
```

Leave this terminal running and use a second terminal for the `curl` commands above. The tables and the demo data are created automatically on the first start (the database itself must already exist), so no seeding step is needed. If the server exits with "Could not connect to / set up PostgreSQL", check `DATABASE_URL` in `server/.env`.

**Check that it works** (use the partner key from your `API_KEYS`):

```bash
curl -H "X-API-Key: <your-api-key>" http://localhost:3000/api/artisans
```

You should see JSON starting with `{"ok":true,"artisans":[`. Without the header you get `401`.

**Run the website locally too:** in `client/`, copy `.env.example` to `.env` and set `VITE_API_KEY` to the **web** key from your `API_KEYS`, then `npm install` and `npm run dev`.

**Run the API security tests** (they do not connect to a database):

```bash
cd server
npm test
```

**Reset the demo data** (for example after trying the PATCH): stop the server with `Ctrl+C`, then recreate the database and start again:

```bash
dropdb juakali && createdb juakali
npm start
```

**Moving data over from the old SQLite version:** if you have an existing `server/juakali.db` you want to keep, run this once against the fresh, empty PostgreSQL database *before* the first `npm start` (needs Node 22.13+):

```bash
npm run migrate:sqlite                    # reads server/juakali.db
npm run migrate:sqlite -- path/to/old.db  # or point at another file
```

Passwords, bookings, reviews and artisan blood-type data are copied as they are; login sessions are not, so everyone signs in again.

**Port already in use?** Start on another port: `PORT=3001 npm start` (macOS/Linux) or `$env:PORT=3001; npm start` (PowerShell), and use that port in the URLs.

---

## Deploy: Render (API + PostgreSQL) and Vercel (client)

**Render: database.** Create a *PostgreSQL* instance. Copy its **Internal Database URL** (use the External one only when connecting from your own computer).

**Render: web service.** Root Directory `server`, Build Command `npm install`, Start Command `npm start`. Environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | the Internal Database URL from the step above |
| `SESSION_SECRET` | a long random string (**required**: the server refuses to start in production without it) |
| `CORS_ORIGIN` | your Vercel URL, e.g. `https://your-app.vercel.app` (no trailing slash; comma-separate several) |
| `API_KEYS` | one entry per consumer, e.g. `organ-donation:partner:<key>,web-app:web:<key>` (see below) |

On the first successful start the log shows `Database seeded with initial demo data.` If the service exits with `Could not connect to / set up PostgreSQL`, `DATABASE_URL` is missing or wrong.

**Vercel: client.** Root Directory `client`. Add the environment variable `VITE_API_URL` = `https://your-service.onrender.com/api` (note the `/api`), then **redeploy**. Also add `VITE_API_KEY` = the **web** key from `API_KEYS`. Vite bakes both in at build time, so changing them without redeploying does nothing.

**Getting your old data into the Render database.** The seed only creates the demo accounts. To load your old `juakali.db` instead, run this from your computer against an *empty* database, using the External Database URL:

```bash
cd server
DATABASE_URL="<External Database URL>" DATABASE_SSL=true npm run migrate:sqlite -- path/to/juakali.db
```

(PowerShell: `$env:DATABASE_URL="..."; $env:DATABASE_SSL="true"; npm run migrate:sqlite -- path/to/juakali.db`.) It refuses to run if users already exist. If the server already seeded the demo data, empty the database first, which **deletes everything in it**: `psql "<External Database URL>" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`.

**Safari / "I log in but get logged out straight away".** Some browsers block cookies set by a different domain. The fix is to make the API look like it is on the same domain: leave `VITE_API_URL` unset (keep `VITE_API_KEY`) and put this in `client/vercel.json` (replacing the URL), then redeploy:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://your-service.onrender.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Render's free tier sleeps when idle, so the first request after a quiet period can take about a minute.

---

## API keys, for the people running the server

Keys live in the `API_KEYS` environment variable (Render's Environment tab, or `server/.env` locally), never in the code or the repo. The format is one entry per consumer, comma-separated:

```
API_KEYS=label:scope:key[:limitPerMinute],label:scope:key,...
```

| Part | Meaning |
|------|---------|
| `label` | who the key belongs to, e.g. `organ-donation`. Printed at startup (never the key). |
| `scope` | `partner`: only the four partner `GET` endpoints. `web`: only the website's own endpoints (login, bookings, reviews...). A key used on the wrong side gets `403`. |
| `key` | a long random string with no commas or colons |
| `limit` | optional requests per minute for this key (default `100`, or `RATE_LIMIT_MAX`) |

1. Generate one key per consumer:
   ```bash
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
   ```
2. Add them, for example: `API_KEYS=organ-donation:partner:<generated>,web-app:web:<generated>:600,team-testing:partner:<generated>`
3. Send each partner **only their own** key, privately (not in the class channel, an issue, or the repo).
4. The website uses the `web` key: set the same value as `VITE_API_KEY` in `client/.env` and on Vercel. Note that anything built into browser code is readable by visitors, so the web key identifies the site; it is not a secret (see `SECURITY_AUDIT.md`).
5. **To revoke or rotate** a key: change or delete its entry and redeploy, then send the new key to that consumer. If a key was ever committed to git, treat it as leaked and replace it.

On startup the log shows how many keys loaded (`API keys loaded: 2 (organ-donation/partner, web-app/web)`). If it says `none`, every request will get `401`. The old `PARTNER_API_KEYS` variable still works and is treated as partner-scope keys.

The rate limiter counts per key in the server's memory, so it resets when the server restarts and is not shared between several server copies (production systems use something like Redis).
