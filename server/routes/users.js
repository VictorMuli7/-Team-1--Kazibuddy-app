const express = require("express");
const db = require("../db");
const { requireRole, asyncHandler } = require("../middleware");

const router = express.Router();

function toPublicUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return { ...rest, verified: !!rest.verified, injured: !!rest.injured };
}

/* ---------- GET /api/users  (admin only) ---------- */
router.get("/", requireRole("admin"), asyncHandler(async (req, res) => {
  const { rows } = await db.query("SELECT * FROM users ORDER BY joined DESC, id");
  res.json({ ok: true, users: rows.map(toPublicUser) });
}));

/* ---------- GET /api/users/me  (own profile, any signed-in role) ---------- */
router.get("/me", requireRole(), asyncHandler(async (req, res) => {
  const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [req.session.user.id]);
  res.json({ ok: true, user: toPublicUser(rows[0]) });
}));

/* ---------- PATCH /api/users/me  (artisan updates their own listing) ---------- */
router.patch("/me", requireRole("artisan"), asyncHandler(async (req, res) => {
  const { rate, bio, injured } = req.body || {};
  if ((rate !== undefined && (typeof rate !== "string" || rate.length > 60)) ||
      (bio !== undefined && (typeof bio !== "string" || bio.length > 500))) {
    return res.status(400).json({ ok: false, error: "Rate (max 60 characters) and bio (max 500) must be text." });
  }
  if (injured !== undefined && typeof injured !== "boolean") {
    return res.status(400).json({ ok: false, error: "Injury status must be a boolean." });
  }
  const current = await db.query("SELECT * FROM users WHERE id = $1", [req.session.user.id]);
  const user = current.rows[0];
  if (!user) return res.status(404).json({ ok: false, error: "User not found." });

  const updated = await db.query(
    "UPDATE users SET rate = $1, bio = $2, injured = $3 WHERE id = $4 RETURNING *",
    [
      rate !== undefined ? rate : user.rate,
      bio !== undefined ? bio : user.bio,
      injured !== undefined ? injured : user.injured,
      user.id,
    ]
  );
  res.json({ ok: true, user: toPublicUser(updated.rows[0]) });
}));

/* ---------- PATCH /api/users/:id  (admin only — verify / suspend / activate) ---------- */
router.patch("/:id", requireRole("admin"), asyncHandler(async (req, res) => {
  const { verified, status } = req.body || {};
  const current = await db.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
  const user = current.rows[0];
  if (!user) return res.status(404).json({ ok: false, error: "User not found." });

  const updated = await db.query(
    "UPDATE users SET verified = $1, status = $2 WHERE id = $3 RETURNING *",
    [typeof verified === "boolean" ? verified : user.verified, status || user.status, user.id]
  );
  res.json({ ok: true, user: toPublicUser(updated.rows[0]) });
}));

module.exports = router;
