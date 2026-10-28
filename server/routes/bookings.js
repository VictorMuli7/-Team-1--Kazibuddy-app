const express = require("express");
const db = require("../db");
const { requireRole, asyncHandler } = require("../middleware");

const router = express.Router();

/* One query returns each booking together with the customer's and artisan's
   names, instead of two extra lookups per booking. */
const BOOKING_SELECT = `
    SELECT b.*, c.fullname AS customer_name, a.fullname AS artisan_name
    FROM bookings b
    LEFT JOIN users c ON c.id = b.customer_id
    LEFT JOIN users a ON a.id = b.artisan_id`;

function toBooking(row) {
    return {
        id: row.id,
        customerId: row.customer_id,
        customerName: row.customer_name || "Unknown",
        service: row.service,
        artisanId: row.artisan_id,
        artisanName: row.artisan_name || "Unknown",
        date: row.date,
        status: row.status,
        price: row.price,
    };
}

async function getBooking(id) {
    const { rows } = await db.query(`${BOOKING_SELECT} WHERE b.id = $1`, [id]);
    return rows[0] || null;
}

/* Finds an artisan for a service: prefers a verified, active artisan whose
   skill matches; falls back to any verified/active artisan. */
async function findArtisanForService(serviceTitle) {
    const { rows: artisans } = await db.query(
        "SELECT * FROM users WHERE role = 'artisan' AND status = 'active' AND verified = TRUE ORDER BY joined, id"
    );
    const norm = (s) => (s || "").toLowerCase();
    const direct = artisans.find((a) => norm(a.skill) === norm(serviceTitle));
    if (direct) return direct;
    const partial = artisans.find(
        (a) => norm(a.skill).includes(norm(serviceTitle)) || norm(serviceTitle).includes(norm(a.skill))
    );
    if (partial) return partial;
    return artisans[0] || null;
}

/* ---------- GET /api/bookings  (scoped to the signed-in user's role) ---------- */
router.get("/", requireRole(), asyncHandler(async (req, res) => {
    const session = req.session.user;
    let result;
    if (session.role === "admin") {
        result = await db.query(`${BOOKING_SELECT} ORDER BY b.date DESC, b.id`);
    } else if (session.role === "artisan") {
        result = await db.query(`${BOOKING_SELECT} WHERE b.artisan_id = $1 ORDER BY b.date DESC, b.id`, [session.id]);
    } else {
        result = await db.query(`${BOOKING_SELECT} WHERE b.customer_id = $1 ORDER BY b.date DESC, b.id`, [session.id]);
    }
    res.json({ ok: true, bookings: result.rows.map(toBooking) });
}));

/* ---------- POST /api/bookings  (customer creates a booking) ---------- */
router.post("/", requireRole("customer"), asyncHandler(async (req, res) => {
    const { serviceTitle, price, date } = req.body || {};
    if (!serviceTitle || !date) {
        return res.status(400).json({ ok: false, error: "Please choose a service and a date." });
    }

    const artisan = await findArtisanForService(serviceTitle);
    if (!artisan) {
        return res.status(409).json({ ok: false, error: "No artisan is currently available for this service. Please try again later." });
    }

    const id = "b-" + Date.now();
    await db.query(
        `INSERT INTO bookings (id, customer_id, service, artisan_id, date, status, price)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
        [id, req.session.user.id, serviceTitle, artisan.id, date, price || null]
    );

    res.json({ ok: true, booking: toBooking(await getBooking(id)) });
}));

/* ---------- GET /api/bookings/:id  (full record — public, for the organ donation app) ---------- */
/* NOTE: publicly readable by design (matches openapi.yaml's security: []).
   This does expose customerName to an external consumer — worth a privacy
   gut-check with your team before this ships, since it wasn't demanded by
   a specific need statement, just added for symmetry with /artisans. */
router.get("/:id", asyncHandler(async (req, res) => {
    const booking = await getBooking(req.params.id);
    if (!booking) {
        return res.status(404).json({ ok: false, error: "Booking not found." });
    }
    res.json({ ok: true, booking: toBooking(booking) });
}));

/* ---------- GET /api/bookings/:id/status  (public — the organ donation app's actual need) ---------- */
router.get("/:id/status", asyncHandler(async (req, res) => {
    const { rows } = await db.query("SELECT status FROM bookings WHERE id = $1", [req.params.id]);
    if (!rows[0]) {
        return res.status(404).json({ ok: false, error: "Booking not found." });
    }
    res.json({ ok: true, status: rows[0].status });
}));

/* ---------- PATCH /api/bookings/:id/status  (artisan accepts/declines/completes their own job) ---------- */
/* This replaces the old PATCH /api/bookings/:id — same logic, moved to the
   dedicated /status path per the design decision in ENDPOINT_LIST.md /
   openapi.yaml, to avoid two routes doing the same job. */
router.patch("/:id/status", requireRole("artisan"), asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    if (!["upcoming", "declined", "completed"].includes(status)) {
        return res.status(400).json({ ok: false, error: "Invalid status." });
    }

    const current = await db.query("SELECT * FROM bookings WHERE id = $1", [req.params.id]);
    const booking = current.rows[0];
    if (!booking || booking.artisan_id !== req.session.user.id) {
        return res.status(404).json({ ok: false, error: "Booking not found." });
    }

    await db.query("UPDATE bookings SET status = $1 WHERE id = $2", [status, booking.id]);
    res.json({ ok: true, booking: toBooking(await getBooking(booking.id)) });
}));

module.exports = router;
