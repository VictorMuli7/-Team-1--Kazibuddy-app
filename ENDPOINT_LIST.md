| Method | Path | Purpose | Maps to Need |
|--------|------|---------|--------------|
| GET | /artisans | Return verified artisans and their services; supports filtering via query params (e.g. `?service=plumbing&verified=true`) — includes each artisan's own `rate` | "The organ donation app needs to read verified artisans and their services in order to identify workers who can provide services when the hospital needs them." |
| GET | /artisans/{id} | Return details of a specific artisan, including skills, bio, and rate | "The organ donation app needs to read verified artisans and their services in order to identify workers who can provide services when the hospital needs them." |
| GET | /bookings | Return bookings, filterable by status (e.g. `?status=upcoming`) to identify artisans who agreed to a job | "The organ donation app needs to read actions taken by the artisan (accepted or declined) in order to identify workers who have agreed to perform a particular service." |
| GET | /bookings/{id} | Return the full booking record (customer, artisan, service, date, price, status) | Supports the same need above with full context, not just the status field alone |
| GET | /bookings/{id}/status | Return a specific booking's status — `pending`, `upcoming` (accepted), `declined`, or `completed` | "The organ donation app needs to read actions taken by the artisan (accepted or declined) in order to identify workers who have agreed to perform a particular service." |
| POST | /bookings | Create a new booking request for an artisan | Supports the booking workflow that produces the accept/decline actions the need above depends on |
| PATCH | /bookings/{id}/status | Update a booking's status to `upcoming`, `declined`, or `completed` | Write-side counterpart of the same need above |
| GET | /appointments | Return clinic appointments for the signed-in artisan | Internal dashboard feature; appointments are private to the artisan |
| POST | /appointments | Request an appointment for `General OPD`, `Dental`, or `Pediatrics` on a selected date; starts with `pending` status. Artisan-only | Internal dashboard feature for artisans to book clinic appointments |
| PATCH | /users/me/blood-info | Artisan updates their own `blood_type` (`A`, `B`, `AB`, `O`) and `rhesus_factor` (`positive`, `negative`); both required. Artisan-only | Not from the original need statements — added with the blood type / rhesus factor field on artisan signup, so artisans can correct it after registering |
| GET | /donors | List artisans who have given a blood group, filterable with `?blood_type=O&rhesus_factor=positive`. Returns `id`, `fullname`, `phone`, `skill`, `verified`, `blood_type`, `rhesus_factor`. Admin-only; suspended artisans excluded | Not from the original need statements — added so an admin can find artisans of a particular blood group |
| GET | /donors/summary | Count of artisans per blood group, plus a `total`. Admin-only | Not from the original need statements — overview of the same data as `/donors` |

**Note on pricing (Need 3):** *"The organ donation app needs to read the prices
charged by the artisan in order to compare service costs and select a
suitable worker."* No separate `/services` endpoint — this need is already
satisfied by the `rate` field returned on every artisan object from
`/artisans` and `/artisans/{id}` above. The need's own wording says "prices
**charged by the artisan**," not "price of the service" — pricing is
per-artisan, not a fixed catalog value, so a standalone services endpoint
would misrepresent how pricing actually works.

### Status values — corrected

`status` is always one of exactly four real values: `pending`, `upcoming`,
`declined`, `completed`. **There is no `accepted` value.** "Accepted" in the
need statement's plain-language phrasing maps to the real value `upcoming` —
every path and example above uses the corrected value.

### Design decisions made

- **`GET /bookings/{id}` added** alongside the existing `/status` sub-path,
  so bookings follow the same collection + item pattern as `/artisans` and
  `/artisans/{id}`. Not every need statement maps to it directly — it's a
  reasonable general-read capability, same as `POST /bookings` was already
  included to support the workflow rather than a specific need line.
- **`/bookings/{id}/status` stays as a dedicated nested sub-resource**, kept
  as the target design even though the current server only has a general
  `PATCH /api/bookings/:id`. A state that belongs to one specific resource
  (an artisan's accept/decline decision on one booking) is exactly the kind
  of thing the lecture's nesting rule calls for — this list describes the
  intended shape; whoever implements it in Week 5 will need to add the
  `/status` sub-path to the real routes rather than reuse the existing
  general update endpoint. That implementation step is separate from this
  document and hasn't happened yet.
- **Blood type and rhesus factor are stored on the `users` table** as
  `blood_type` and `rhesus_factor`, collected at artisan signup
  (`POST /auth/register`, required for artisans, ignored for customers).
  Allowed values are `A`, `B`, `AB`, `O` and `positive`, `negative`; the
  database rejects anything else.
- **Blood group is health information, so it is deliberately not returned by
  `/artisans` or `/artisans/{id}`.** Those endpoints are public and return a
  fixed list of fields. Blood group is only visible to the artisan
  themselves (`GET /users/me`) and to admins (`GET /users`, `/donors`,
  `/donors/summary`). If the organ donation app needs it, that should be a
  team decision made deliberately, not a side effect of editing the public
  artisan response.
