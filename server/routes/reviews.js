const express = require("express");
const db = require("../db");
const { asyncHandler } = require("../middleware");

const router = express.Router();

/* ---------- GET /api/reviews ---------- */
router.get("/", asyncHandler(async (req, res) => {
  const { rows } = await db.query("SELECT * FROM reviews ORDER BY id DESC");
  res.json({ ok: true, reviews: rows });
}));

/* ---------- POST /api/reviews ---------- */
router.post("/", asyncHandler(async (req, res) => {
  const { name, category, stars, text } = req.body || {};
  const ratingNum = parseInt(stars, 10);

  if (!name || !String(name).trim()) return res.status(400).json({ ok: false, error: "Please enter your name." });
  if (!category) return res.status(400).json({ ok: false, error: "Please select a service." });
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) return res.status(400).json({ ok: false, error: "Please select a star rating." });
  if (!text || text.trim().length < 10) return res.status(400).json({ ok: false, error: "Please write at least 10 characters in your review." });

  const date = new Date().toISOString().slice(0, 10);
  const { rows } = await db.query(
    "INSERT INTO reviews (name, category, stars, date, text) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [String(name).trim(), category, ratingNum, date, text.trim()]
  );

  res.json({ ok: true, review: rows[0] });
}));

module.exports = router;
