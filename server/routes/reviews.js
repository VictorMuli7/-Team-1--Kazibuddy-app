const express = require("express");
const db = require("../db");

const router = express.Router();

/* ---------- GET /api/reviews ---------- */
router.get("/", (req, res) => {
  const reviews = db.prepare("SELECT * FROM reviews ORDER BY id DESC").all();
  res.json({ ok: true, reviews });
});

/* ---------- POST /api/reviews ---------- */
router.post("/", (req, res) => {
  const { name, category, stars, text } = req.body || {};
  const ratingNum = parseInt(stars, 10);

  if (!name || !String(name).trim()) return res.status(400).json({ ok: false, error: "Please enter your name." });
  if (!category) return res.status(400).json({ ok: false, error: "Please select a service." });
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) return res.status(400).json({ ok: false, error: "Please select a star rating." });
  if (!text || text.trim().length < 10) return res.status(400).json({ ok: false, error: "Please write at least 10 characters in your review." });

  const date = new Date().toISOString().slice(0, 10);
  const info = db.prepare(
    "INSERT INTO reviews (name, category, stars, date, text) VALUES (?, ?, ?, ?, ?)"
  ).run(String(name).trim(), category, ratingNum, date, text.trim());

  const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(info.lastInsertRowid);
  res.json({ ok: true, review });
});

module.exports = router;
