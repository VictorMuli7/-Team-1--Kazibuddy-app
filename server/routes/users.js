const express = require("express");
const { pool } = require("../db");
const { requireRole, asyncHandler } = require("../middleware");

const router = express.Router();

function toPublicUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return { ...rest, verified: !!rest.verified };
}

/* ---------- GET /api/users  (admin only) ---------- */
router.get("/", requireRole("admin"), asyncHandler(async (req, res) => {
  const result = await pool.query("SELECT * FROM users ORDER BY joined DESC");
  const users = result.rows.map(toPublicUser);
  res.json({ ok: true, users });
}));

/* ---------- GET /api/users/me  (own profile, any signed-in role) ---------- */
router.get("/me", requireRole(), asyncHandler(async (req, res) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.session.user.id]);
  const user = result.rows[0];
  res.json({ ok: true, user: toPublicUser(user) });
}));

/* ---------- PATCH /api/users/me  (artisan updates their own listing) ---------- */
router.patch("/me", requireRole("artisan"), asyncHandler(async (req, res) => {
  const { rate, bio } = req.body || {};
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.session.user.id]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ ok: false, error: "User not found." });

  await pool.query("UPDATE users SET rate = $1, bio = $2 WHERE id = $3", [
    rate !== undefined ? rate : user.rate,
    bio !== undefined ? bio : user.bio,
    user.id
  ]);

  const updatedResult = await pool.query("SELECT * FROM users WHERE id = $1", [user.id]);
  const updated = updatedResult.rows[0];
  res.json({ ok: true, user: toPublicUser(updated) });
}));

/* ---------- PATCH /api/users/:id  (admin only — verify / suspend / activate) ---------- */
router.patch("/:id", requireRole("admin"), asyncHandler(async (req, res) => {
  const { verified, status } = req.body || {};
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ ok: false, error: "User not found." });

  const next = {
    verified: typeof verified === "boolean" ? verified : user.verified,
    status: status || user.status,
  };
  await pool.query("UPDATE users SET verified = $1, status = $2 WHERE id = $3", [next.verified, next.status, user.id]);

  const updatedResult = await pool.query("SELECT * FROM users WHERE id = $1", [user.id]);
  const updated = updatedResult.rows[0];
  res.json({ ok: true, user: toPublicUser(updated) });
}));

module.exports = router;
