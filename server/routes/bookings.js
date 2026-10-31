const express = require("express");
const { randomUUID } = require("crypto");
const db = require("../db");
const { requireRole, asyncHandler } = require("../middleware");
const { requireScope } = require("../middleware/apiSecurity");

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

function toPartnerBooking(row) {
    return {
        id: row.id,
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

/* Select an available artisan while locking their row until booking creation. */
async function findArtisanForService(serviceTitle, client) {
    const { rows } = await client.query(
        `SELECT * FROM users
         WHERE role = 'artisan' AND status = 'active' AND verified = TRUE AND injured = FALSE
         ORDER BY
           CASE
             WHEN lower(skill) = lower($1) THEN 0
             WHEN strpos(lower(skill), lower($1)) > 0
               OR strpos(lower($1), lower(skill)) > 0 THEN 1
             ELSE 2
           END,
           joined, id
         LIMIT 1
         FOR UPDATE`,
        [serviceTitle]
    );
    return rows[0] || null;
}

function isRealDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/* ---------- GET /api/bookings  (scoped to the signed-in user's role) ---------- */
router.get("/", requireScope("web"), requireRole(), asyncHandler(async (req, res) => {
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
router.post("/", requireScope("web"), requireRole("customer"), asyncHandler(async (req, res) => {
    const { serviceTitle, price, date } = req.body || {};
    if (!serviceTitle || !date) {
        return res.status(400).json({ ok: false, error: "Please choose a service and a date." });
    }
    if (typeof serviceTitle !== "string" || serviceTitle.length > 100 ||
        (price != null && (typeof price !== "string" || price.length > 40))) {
        return res.status(400).json({ ok: false, error: "Invalid service or price." });
    }
    if (!isRealDate(date)) {
        return res.status(400).json({ ok: false, error: "Please choose a valid date." });
    }

    const client = await db.pool.connect();
    let id;
    try {
        await client.query("BEGIN");
        const artisan = await findArtisanForService(serviceTitle, client);
        if (!artisan) {
            await client.query("ROLLBACK");
            return res.status(409).json({ ok: false, error: "No artisan is currently available for this service. Please try again later." });
        }

        id = "b-" + randomUUID();
        await client.query(
            `INSERT INTO bookings (id, customer_id, service, artisan_id, date, status, price)
             VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
            [id, req.session.user.id, serviceTitle, artisan.id, date, price || null]
        );
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
    } finally {
        client.release();
    }

    res.json({ ok: true, booking: toBooking(await getBooking(id)) });
}));

/* ---------- GET /api/bookings/:id (partner key; omits customer identity) ---------- */
router.get("/:id", requireScope("partner"), asyncHandler(async (req, res) => {
    const booking = await getBooking(req.params.id);
    if (!booking) {
        return res.status(404).json({ ok: false, error: "Booking not found." });
    }
    res.json({ ok: true, booking: toPartnerBooking(booking) });
}));

/* ---------- GET /api/bookings/:id/status (partner key) ---------- */
router.get("/:id/status", requireScope("partner"), asyncHandler(async (req, res) => {
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
router.patch("/:id/status", requireScope("web"), requireRole("artisan"), asyncHandler(async (req, res) => {
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
