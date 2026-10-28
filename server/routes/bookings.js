const express = require("express");
const { pool } = require("../db");
const { requireRole, asyncHandler } = require("../middleware");

const router = express.Router();

function enrich(booking) {
    return {
        id: booking.id,
        customerId: booking.customer_id,
        customerName: booking.customer_name || "Unknown",
        service: booking.service,
        artisanId: booking.artisan_id,
        artisanName: booking.artisan_name || "Unknown",
        date: booking.date,
        status: booking.status,
        price: booking.price,
    };
}

const BOOKING_SELECT = `
    SELECT b.*, customer.fullname AS customer_name, artisan.fullname AS artisan_name
    FROM bookings b
    LEFT JOIN users customer ON customer.id = b.customer_id
    LEFT JOIN users artisan ON artisan.id = b.artisan_id
`;

async function findArtisanForService(serviceTitle) {
    const result = await pool.query(
        "SELECT * FROM users WHERE role = 'artisan' AND status = 'active' AND verified = TRUE"
    );
    const artisans = result.rows;
    const norm = (value) => (value || "").toLowerCase();
    const direct = artisans.find((artisan) => norm(artisan.skill) === norm(serviceTitle));
    if (direct) return direct;
    const partial = artisans.find(
        (artisan) => norm(artisan.skill).includes(norm(serviceTitle)) || norm(serviceTitle).includes(norm(artisan.skill))
    );
    return partial || artisans[0] || null;
}

router.get("/", requireRole(), asyncHandler(async (req, res) => {
    const { role, id } = req.session.user;
    let query = BOOKING_SELECT;
    let params = [];
    if (role === "artisan") {
        query += " WHERE b.artisan_id = $1";
        params = [id];
    } else if (role !== "admin") {
        query += " WHERE b.customer_id = $1";
        params = [id];
    }

    const result = await pool.query(query, params);
    res.json({ ok: true, bookings: result.rows.map(enrich) });
}));

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
    await pool.query(`
        INSERT INTO bookings (id, customer_id, service, artisan_id, date, status, price)
        VALUES ($1, $2, $3, $4, $5, 'pending', $6)
    `, [id, req.session.user.id, serviceTitle, artisan.id, date, price || null]);

    const result = await pool.query(`${BOOKING_SELECT} WHERE b.id = $1`, [id]);
    res.json({ ok: true, booking: enrich(result.rows[0]) });
}));

router.get("/:id", asyncHandler(async (req, res) => {
    const result = await pool.query(`${BOOKING_SELECT} WHERE b.id = $1`, [req.params.id]);
    const booking = result.rows[0];
    if (!booking) {
        return res.status(404).json({ ok: false, error: "Booking not found." });
    }
    res.json({ ok: true, booking: enrich(booking) });
}));

router.get("/:id/status", asyncHandler(async (req, res) => {
    const result = await pool.query("SELECT status FROM bookings WHERE id = $1", [req.params.id]);
    const booking = result.rows[0];
    if (!booking) {
        return res.status(404).json({ ok: false, error: "Booking not found." });
    }
    res.json({ ok: true, status: booking.status });
}));

router.patch("/:id/status", requireRole("artisan"), asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    if (!["upcoming", "declined", "completed"].includes(status)) {
        return res.status(400).json({ ok: false, error: "Invalid status." });
    }

    const result = await pool.query(
        "SELECT * FROM bookings WHERE id = $1 AND artisan_id = $2",
        [req.params.id, req.session.user.id]
    );
    const booking = result.rows[0];
    if (!booking) {
        return res.status(404).json({ ok: false, error: "Booking not found." });
    }

    await pool.query("UPDATE bookings SET status = $1 WHERE id = $2", [status, booking.id]);
    const updated = await pool.query(`${BOOKING_SELECT} WHERE b.id = $1`, [booking.id]);
    res.json({ ok: true, booking: enrich(updated.rows[0]) });
}));

module.exports = router;
