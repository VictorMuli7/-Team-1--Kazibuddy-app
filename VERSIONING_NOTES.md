# Versioning Notes (Week 13)

## 1. The change (one sentence)

The artisans API now has a v2 (`/api/v2/artisans`) where the list is `{ ok, data: [...], count }` instead of `{ ok, artisans: [...] }`, and `fullname` is renamed `name`. v1 keeps running unchanged beside it.

## 2. Why it is worth a break

The old list had no count and used a bespoke `artisans` key, so adding paging later would have needed another breaking change. Wrapping everything under `data` + `count` now means paging can be added without breaking anyone again. `fullname` → `name` removes an inconsistent field name.

## 3. Prediction: which line in the partner's code fails

The organ donation app reads our artisan list in its Week 10 integration. Any line that reads `body.artisans` (list) or `body.artisan` (single) will get `undefined`, and any line that reads `artisan.fullname` will get `undefined`.

> **TODO (you):** ask the organ donation team for the exact file and line and write it here. The code above is a prediction from our response shape, not from their repo.

## Where v2 lives

- `server/routes/v2.js`: new shape, one `toV2()` function holds the change
- `server/routes/v1.js`: wraps the **untouched** `server/routes/artisans.js` with deprecation headers
- `server/middleware/deprecate.js`: `Deprecation`, `Sunset`, `Link` headers; sunset date is one constant (`V1_SUNSET`, default `2026-11-13`)
- `server/app.js`: all mounts, after the key check and rate limit. `server/server.js` now only starts listening.
- Evidence v1 did not change: `v1_before.json` (taken from the original code) vs `v1_after.json` (new code), plus `server/test/versions.test.js`

## Part E: receiving the upstream notice (HospitalQ)

> **TODO (you), needs HospitalQ's notice.** The switch is built: `HOSPITALQ_VERSION=v1|v2` in `server/.env`, all shape knowledge in `server/services/partner.js`. v2 there is deliberately a loud placeholder until you fill in their paths and response shape.

- How it felt to receive the notice: <1–2 sentences>
- Their sunset date: <date>
- Did `"stale": false` / no "partner call failed" in the log confirm the switch? <note>
- Did their `/stats` show my calls on v2? <screenshot or log lines>

## Part F: who still uses v1?

Run against the **deployed** API (the numbers live in memory and reset on restart):

```
curl -s -H "X-API-Key: <your-key>" https://team-1-kazibuddy-app.onrender.com/api/stats
```

Rows to read: `GET /api/artisans/` (old URL), `GET /api/v1/artisans/`, `GET /api/v2/artisans`, and the `caller` label in the log lines for each.

| Row | Calls | Caller labels |
|---|---|---|
| GET /api/artisans/ (unversioned) | | |
| GET /api/v1/artisans/ | | |
| GET /api/v2/artisans | | |

Is the partner still on v1? Could v1 be switched off today without breaking anyone? <answer>

## Reflection (150–250 words, your own words)

> **TODO (you).** This one has to come from your own experience, so it's left blank. Answer all four, and be specific ("I found out when my page showed saved data and didn't know whose bug it was" beats "it was annoying"):
>
> 1. What was it like to receive a breaking change on short notice? How did you find out, and what did you do first?
> 2. What did your partner's notice do well, and what was missing?
> 3. Read your own notice again as your partner. What would you change?
> 4. As the API owner next time, what is one thing you would do differently?
