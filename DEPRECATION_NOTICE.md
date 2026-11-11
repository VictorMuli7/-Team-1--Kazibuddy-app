# Deprecation notice: Jua Kali Artisans API v1

**To:** <partner name>, Organ Donation App team
**From:** <your name>, Team 1 (Kazibuddy / Jua Kali API)
**Date:** 2026-11-11

## Summary

v1 of `GET /api/artisans` and `GET /api/artisans/{id}` is **deprecated**. **v2 is live now.**
v1 will stop working on **Friday 13 November 2026**. Please move before then.

## What is changing

- The list response key changes: `{ "ok": true, "artisans": [ ... ] }` becomes `{ "ok": true, "data": [ ... ], "count": N }`
- The single-artisan response key changes: `{ "ok": true, "artisan": { ... } }` becomes `{ "ok": true, "data": { ... } }`
- The field `fullname` is renamed `name`
- **Nothing else changes:** `id`, `phone`, `skill`, `verified`, `bio`, `rate`, `blood_type`, `rhesus_factor`, the `?skill=` and `?verified=` filters, the 404 body (`{ "ok": false, "error": "Artisan not found." }`), your API key and its scope.

## Why

The list now returns a `count`, and everything sits under one `data` key, so we can add paging later without breaking you a second time. `fullname` becomes `name` to match the naming used everywhere else in our API.

## Before and after

v1 `GET /api/artisans?skill=Plumbing`

```json
{
  "ok": true,
  "artisans": [
    { "id": "a-100", "fullname": "Amina Wanjiru", "phone": "0711000001", "skill": "Plumbing",
      "verified": true, "bio": "Ten years fixing pipes.", "rate": "KES 1500/hr",
      "blood_type": "O", "rhesus_factor": "positive" }
  ]
}
```

v2 `GET /api/v2/artisans?skill=Plumbing`

```json
{
  "ok": true,
  "data": [
    { "id": "a-100", "name": "Amina Wanjiru", "phone": "0711000001", "skill": "Plumbing",
      "verified": true, "bio": "Ten years fixing pipes.", "rate": "KES 1500/hr",
      "blood_type": "O", "rhesus_factor": "positive" }
  ],
  "count": 1
}
```

## How to migrate

1. Call `/api/v2/artisans` instead of `/api/artisans` (and `/api/v2/artisans/{id}` for one artisan). Same key, same `?skill=` and `?verified=` filters.
2. Read the list from `body.data` instead of `body.artisans`, and a single artisan from `body.data` instead of `body.artisan`.
3. Read `name` where you read `fullname`.
4. Test it, then tell me, so I can see your calls to `GET /api/v2/artisans` in my logs.

Tip: keep the response shape in one function in your code, so this is a one-place change (and an easy rollback).

## Timeline

- **Today (2026-11-11):** v2 is live. v1 and the old `/api/artisans` URL still work exactly as before, and now send `Deprecation`, `Sunset` and `Link` headers on every response.
- **2026-11-13:** v1 and the unversioned `/api/artisans` URL stop working.

## Questions

Message me any time. I will reply within <time>. Please reply once you have read this, so I know it arrived.
