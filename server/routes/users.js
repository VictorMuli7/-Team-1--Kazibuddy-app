const express = require("express");
const db = require("../db");
const { requireRole } = require("../middleware");

const router = express.Router();

function toPublicUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return { ...rest, verified: !!rest.verified };
}

/* ---------- GET /api/users  (admin only) ---------- */
router.get("/", requireRole("admin"), (req, res) => {
  const users = db.prepare("SELECT * FROM users ORDER BY joined DESC").all().map(toPublicUser);
  res.json({ ok: true, users });
});

/* ---------- GET /api/users/me  (own profile, any signed-in role) ---------- */
router.get("/me", requireRole(), (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.session.user.id);
  res.json({ ok: true, user: toPublicUser(user) });
});

/* ---------- PATCH /api/users/me  (artisan updates their own listing) ---------- */
router.patch("/me", requireRole("artisan"), (req, res) => {
  const { rate, bio } = req.body || {};
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.session.user.id);
  if (!user) return res.status(404).json({ ok: false, error: "User not found." });

  db.prepare("UPDATE users SET rate = ?, bio = ? WHERE id = ?").run(
    rate !== undefined ? rate : user.rate,
    bio !== undefined ? bio : user.bio,
    user.id
  );

  const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
  res.json({ ok: true, user: toPublicUser(updated) });
});

/* ---------- PATCH /api/users/:id  (admin only — verify / suspend / activate) ---------- */
router.patch("/:id", requireRole("admin"), (req, res) => {
  const { verified, status } = req.body || {};
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ ok: false, error: "User not found." });

  const next = {
    verified: typeof verified === "boolean" ? (verified ? 1 : 0) : user.verified,
    status: status || user.status,
  };
  db.prepare("UPDATE users SET verified = ?, status = ? WHERE id = ?").run(next.verified, next.status, user.id);

  const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
  res.json({ ok: true, user: toPublicUser(updated) });
});

module.exports = router;
