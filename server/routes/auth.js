const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

function toSessionUser(row) {
  return { id: row.id, role: row.role, fullname: row.fullname, email: row.email };
}

function toPublicUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return { ...rest, verified: !!rest.verified };
}

/* ---------- POST /api/auth/register ---------- */
router.post("/register", (req, res) => {
  const { role, fullname, email, phone, password, skill } = req.body || {};

  if (!role || !["customer", "artisan"].includes(role)) {
    return res.status(400).json({ ok: false, error: "Please choose a valid account type." });
  }
  if (!fullname || !email || !password) {
    return res.status(400).json({ ok: false, error: "Please fill in all required fields." });
  }
  if (role === "artisan" && !skill) {
    return res.status(400).json({ ok: false, error: "Please select your skill." });
  }

  const existing = db.prepare("SELECT id FROM users WHERE lower(email) = lower(?)").get(email);
  if (existing) {
    return res.status(409).json({ ok: false, error: "An account with that email already exists." });
  }

  const id = "u-" + Date.now();
  const password_hash = bcrypt.hashSync(password, 10);
  const joined = new Date().toISOString().slice(0, 10);

  const row = {
    id, role, fullname, email, phone: phone || null, password_hash,
    status: role === "artisan" ? "pending" : "active",
    joined,
    skill: role === "artisan" ? skill : null,
    verified: 0,
    bio: role === "artisan" ? "" : null,
    rate: role === "artisan" ? "Not set yet" : null,
  };

  db.prepare(`
    INSERT INTO users (id, role, fullname, email, phone, password_hash, status, joined, skill, verified, bio, rate)
    VALUES (@id, @role, @fullname, @email, @phone, @password_hash, @status, @joined, @skill, @verified, @bio, @rate)
  `).run(row);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  req.session.user = toSessionUser(user);
  res.json({ ok: true, user: toPublicUser(user) });
});

/* ---------- POST /api/auth/login ---------- */
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Please enter your email and password." });
  }

  const user = db.prepare("SELECT * FROM users WHERE lower(email) = lower(?)").get(email);
  if (!user) return res.status(401).json({ ok: false, error: "No account found with that email." });
  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ ok: false, error: "Incorrect password." });
  }
  if (user.status === "suspended") {
    return res.status(403).json({ ok: false, error: "This account has been suspended. Contact support." });
  }

  req.session.user = toSessionUser(user);
  res.json({ ok: true, user: toPublicUser(user) });
});

/* ---------- POST /api/auth/logout ---------- */
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

/* ---------- GET /api/auth/session ---------- */
router.get("/session", (req, res) => {
  res.json({ ok: true, session: req.session.user || null });
});

module.exports = { router, toPublicUser, toSessionUser };
