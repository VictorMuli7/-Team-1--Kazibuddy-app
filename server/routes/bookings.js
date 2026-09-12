const express = require("express");
const db = require("../db");
const { requireRole } = require("../middleware");

const router = express.Router();

function enrich(booking) {
  const customer = db.prepare("SELECT fullname FROM users WHERE id = ?").get(booking.customer_id);
  const artisan = db.prepare("SELECT fullname FROM users WHERE id = ?").get(booking.artisan_id);
  return {
    id: booking.id,
    customerId: booking.customer_id,
    customerName: customer ? customer.fullname : "Unknown",
    service: booking.service,
    artisanId: booking.artisan_id,
    artisanName: artisan ? artisan.fullname : "Unknown",
    date: booking.date,
    status: booking.status,
    price: booking.price,
  };
}

/* Finds an artisan for a service: prefers a verified, active artisan whose
   skill matches; falls back to any verified/active artisan. */
function findArtisanForService(serviceTitle) {
  const artisans = db.prepare(
    "SELECT * FROM users WHERE role = 'artisan' AND status = 'active' AND verified = 1"
  ).all();
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
router.get("/", requireRole(), (req, res) => {
  const session = req.session.user;
  let rows;
  if (session.role === "admin") {
    rows = db.prepare("SELECT * FROM bookings").all();
  } else if (session.role === "artisan") {
    rows = db.prepare("SELECT * FROM bookings WHERE artisan_id = ?").all(session.id);
  } else {
    rows = db.prepare("SELECT * FROM bookings WHERE customer_id = ?").all(session.id);
  }
  res.json({ ok: true, bookings: rows.map(enrich) });
});

/* ---------- POST /api/bookings  (customer creates a booking) ---------- */
router.post("/", requireRole("customer"), (req, res) => {
  const { serviceTitle, price, date } = req.body || {};
  if (!serviceTitle || !date) {
    return res.status(400).json({ ok: false, error: "Please choose a service and a date." });
  }

  const artisan = findArtisanForService(serviceTitle);
  if (!artisan) {
    return res.status(409).json({ ok: false, error: "No artisan is currently available for this service. Please try again later." });
  }

  const id = "b-" + Date.now();
  db.prepare(`
    INSERT INTO bookings (id, customer_id, service, artisan_id, date, status, price)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(id, req.session.user.id, serviceTitle, artisan.id, date, price || null);

  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
  res.json({ ok: true, booking: enrich(booking) });
});

/* ---------- PATCH /api/bookings/:id  (artisan accepts/declines/completes their own job) ---------- */
router.patch("/:id", requireRole("artisan"), (req, res) => {
  const { status } = req.body || {};
  if (!["upcoming", "declined", "completed"].includes(status)) {
    return res.status(400).json({ ok: false, error: "Invalid status." });
  }

  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id);
  if (!booking || booking.artisan_id !== req.session.user.id) {
    return res.status(404).json({ ok: false, error: "Booking not found." });
  }

  db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, booking.id);
  const updated = db.prepare("SELECT * FROM bookings WHERE id = ?").get(booking.id);
  res.json({ ok: true, booking: enrich(updated) });
});

module.exports = router;
