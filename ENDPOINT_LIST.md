| Method | Path | Purpose | Maps to Need |
|--------|------|---------|--------------|
| GET | /artisans | Return verified artisans and their services; supports filtering via query params (e.g. `?service=plumbing&verified=true`) | Team 2 needs to read verified artisans and their services |
| GET | /artisans/{id} | Return details of a specific artisan, including skills, bio, and services | Team 2 needs to identify a suitable worker |
| GET | /bookings | Return bookings, filterable by status (e.g. `?status=accepted`) to identify artisans who agreed to a job | Team 2 needs to identify workers who agreed to perform services |
| GET | /bookings/{id}/status | Return whether a specific artisan accepted or declined a booking request | Team 2 needs to read artisan actions |
| POST | /bookings | Create a new booking request for an artisan | Supports the booking workflow that produces the accept/decline actions Team 2 needs to read |
| PATCH | /bookings/{id}/status | Update a booking's status to accepted, declined, or completed | Team 2 needs to read artisan actions (this is the write side of that same need) |
| GET | /services | Return all services with pricing, for comparing costs across artisans | Team 2 needs to compare service costs and select a suitable worker |
| GET | /services/{id} | Return pricing and details for one specific service | Team 2 needs to compare service costs and select a suitable worker |
