# Contract Deviations

## 1. Endpoints removed that didn't match real implementation

An earlier draft of the contract included `/services` and `/services/{id}`
as standalone endpoints. Neither had a corresponding route in `server/`, and
pricing is actually stored per-artisan (a `rate` field), not in a separate
services table. Both paths were removed rather than built out, since the
underlying data model doesn't support a services catalog as designed.

## 2. Error responses added

Earlier drafts only documented `200`/`201` responses. A shared `Error`
schema (`{ ok, error }`) and standard `400`/`404`/`401` responses were added
across endpoints, matching the actual error shape the server returns on
failure.

## 3. Duplicate endpoint removed

`PATCH /api/bookings/{id}` and a newly added `PATCH
/api/bookings/{id}/status` both updated the same booking's status field. The
general `PATCH /api/bookings/{id}` was removed, leaving the dedicated
`/status` route as the single way to change a booking's status.

## 4. Verification result

The implemented GET endpoints (`/api/artisans`, `/api/artisans/{id}`,
`/api/bookings/{id}`, `/api/bookings/{id}/status`) were run against a local
instance of the server and compared to the contract field by field —
required field names, presence, and JSON types (e.g. `verified` as a real
boolean, `date` as a plain date string rather than a timestamp). All four
endpoints matched the contract exactly. No deviations were found during
this check.
