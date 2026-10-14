# Jua Kali API

## Overview

The Jua Kali API lets the organ donation app find verified artisans (plumbers, electricians, hair stylists and others) with their rates, and check whether an artisan accepted or declined a booking. It is intended for developers building the hospital's worker-finding feature.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All `GET` endpoints are public, so no token is needed. Only `PATCH /api/bookings/{id}/status` needs a login (artisan only). Log in and save the session cookie:

```
curl -c cookies.txt -X POST "http://localhost:3000/api/auth/login" -H "Content-Type: application/json" -d '{"email":"artisan@juakali.com","password":"Artisan123!"}'
```

Send the cookie on later requests with `-b cookies.txt`. This demo account exists only in the local data.

## Quickstart

Get the verified artisans:

```
curl "http://localhost:3000/api/artisans?verified=true"
```

**Response: `200 OK`**

```
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

On Windows PowerShell, type `curl.exe` instead of `curl`.

## Endpoints

### Artisans

#### List Artisans

```
GET /api/artisans
```

Optional query parameters: `skill` (for example `Hair%20Styling`) and `verified` (defaults to `true`; use `false` to list unverified artisans).

```
curl "http://localhost:3000/api/artisans?skill=Hair%20Styling"
```

**Response: `200 OK`**

```
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

#### Get Artisan by ID

```
GET /api/artisans/{id}
```

```
curl "http://localhost:3000/api/artisans/u-artisan"
```

**Response: `200 OK`**

```
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

### Bookings

#### Get Booking by ID

```
GET /api/bookings/{id}
```

```
curl "http://localhost:3000/api/bookings/b1"
```

**Response: `200 OK`**

```
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

#### Get Booking Status

```
GET /api/bookings/{id}/status
```

Status is one of `pending`, `upcoming` (accepted), `declined` or `completed`.

```
curl "http://localhost:3000/api/bookings/b1/status"
```

**Response: `200 OK`**

```
{
  "ok": true,
  "status": "upcoming"
}
```

#### Update Booking Status

```
PATCH /api/bookings/{id}/status
Content-Type: application/json
```

Needs the artisan login from the Authentication section, and the booking must belong to that artisan. Allowed values: `upcoming`, `declined`, `completed`. This changes the data.

```
curl -b cookies.txt -X PATCH "http://localhost:3000/api/bookings/b3/status" -H "Content-Type: application/json" -d '{"status":"upcoming"}'
```

**Response: `200 OK`**

```
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

## Error Format

Failed requests return an HTTP error status and a JSON object with `ok: false` and an `error` message:

```
{
  "ok": false,
  "error": "Description of the failure"
}
```

### Booking Not Found

**Response: `404 Not Found`**

```
curl "http://localhost:3000/api/bookings/zzz/status"
```

```
{
  "ok": false,
  "error": "Booking not found."
}
```

### Other Errors

| Code | Cause | `error` message |
|------|-------|-----------------|
| 400 | Invalid `status` in a PATCH | `Invalid status.` |
| 401 | Not logged in as an artisan | `Not authorized.` |
| 404 | Unknown artisan | `Artisan not found.` |

## Run the API Locally

### Prerequisites

- Node.js (current LTS) with npm
- Git

### Setup

1. Clone the repository and install dependencies. The folder name starts with a dash, so keep the `./`:

```
git clone https://github.com/VictorMuli7/-Team-1--Kazibuddy-app.git
cd ./-Team-1--Kazibuddy-app/server
npm install
```

2. Start the server:

```
npm start
```

The API listens on `http://localhost:3000`. The database and demo data are created automatically on first start.

3. In a second terminal, run the quickstart command above.

To reset the demo data, stop the server, delete the `juakali.db*` files in `server/`, and start again.
**Reset the demo data** (for example after trying the PATCH): stop the server with `Ctrl+C`, delete the `juakali.db`, `juakali.db-shm` and `juakali.db-wal` files inside `server/`, then run `npm start` again.

**Port already in use?** Start on another port: `PORT=3001 npm start` (macOS/Linux) or `$env:PORT=3001; npm start` (PowerShell), and use that port in the URLs.
