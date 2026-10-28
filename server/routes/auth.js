const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { asyncHandler } = require("../middleware");

const router = express.Router();

const BLOOD_TYPES = ["A", "B", "AB", "O"];
const RHESUS_FACTORS = ["positive", "negative"];

function toSessionUser(row) {
  return { id: row.id, role: row.role, fullname: row.fullname, email: row.email };
}

function toPublicUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return { ...rest, verified: !!rest.verified };
}

/* ---------- POST /api/auth/register ---------- */
router.post("/register", asyncHandler(async (req, res) => {
  const { role, fullname, email, phone, password, skill, blood_type, rhesus_factor } = req.body || {};

  if (!role || !["customer", "artisan"].includes(role)) {
    return res.status(400).json({ ok: false, error: "Please choose a valid account type." });
  }
  if (!fullname || !email || !password) {
    return res.status(400).json({ ok: false, error: "Please fill in all required fields." });
  }
  if (role === "artisan" && !skill) {
    return res.status(400).json({ ok: false, error: "Please select your skill." });
  }
  if (role === "artisan" && !BLOOD_TYPES.includes(blood_type)) {
    return res.status(400).json({ ok: false, error: "Please select your blood type." });
  }
  if (role === "artisan" && !RHESUS_FACTORS.includes(rhesus_factor)) {
    return res.status(400).json({ ok: false, error: "Please select your rhesus factor." });
  }

  const id = "u-" + Date.now();
  const password_hash = bcrypt.hashSync(password, 10);
  const joined = new Date().toISOString().slice(0, 10);

  const row = {
    id, role, fullname, email, phone: phone || null, password_hash,
    status: role === "artisan" ? "pending" : "active",
    joined,
    skill: role === "artisan" ? skill : null,
    verified: false,
    bio: role === "artisan" ? "" : null,
    rate: role === "artisan" ? "Not set yet" : null,
    blood_type: role === "artisan" ? blood_type : null,
    rhesus_factor: role === "artisan" ? rhesus_factor : null,
  };

  const result = await pool.query(`
    INSERT INTO users (id, role, fullname, email, phone, password_hash, status, joined, skill, verified, bio, rate, blood_type, rhesus_factor)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT DO NOTHING
    RETURNING *
  `, [
    row.id, row.role, row.fullname, row.email, row.phone, row.password_hash,
    row.status, row.joined, row.skill, row.verified, row.bio, row.rate,
    row.blood_type, row.rhesus_factor,
  ]);
  if (!result.rows[0]) {
    return res.status(409).json({ ok: false, error: "An account with that email already exists." });
  }

  const user = result.rows[0];
  req.session.user = toSessionUser(user);
  res.json({ ok: true, user: toPublicUser(user) });
}));

/* ---------- POST /api/auth/login ---------- */
router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Please enter your email and password." });
  }

  const result = await pool.query("SELECT * FROM users WHERE lower(email) = lower($1)", [email]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ ok: false, error: "No account found with that email." });
  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ ok: false, error: "Incorrect password." });
  }
  if (user.status === "suspended") {
    return res.status(403).json({ ok: false, error: "This account has been suspended. Contact support." });
  }

  req.session.user = toSessionUser(user);
  res.json({ ok: true, user: toPublicUser(user) });
}));

/* ---------- POST /api/auth/logout ---------- */
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

/* ---------- GET /api/auth/session ---------- */
router.get("/session", (req, res) => {
  res.json({ ok: true, session: req.session.user || null });
});

module.exports = { router, toPublicUser, toSessionUser };
