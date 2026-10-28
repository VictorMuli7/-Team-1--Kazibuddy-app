const express = require("express");
const { randomUUID } = require("crypto");
const { pool } = require("../db");
const { requireRole, asyncHandler } = require("../middleware");

const router = express.Router();
const DEPARTMENTS = ["General OPD", "Dental", "Pediatrics"];

function toAppointment(row) {
  return {
    id: row.id,
    department: row.department,
    date: row.date,
    status: row.status,
    createdAt: row.created_at,
  };
}

router.get("/", requireRole("artisan"), asyncHandler(async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM appointments WHERE artisan_id = $1 ORDER BY date DESC, created_at DESC",
    [req.session.user.id]
  );

  res.json({ ok: true, appointments: result.rows.map(toAppointment) });
}));

router.post("/", requireRole("artisan"), asyncHandler(async (req, res) => {
  const { department, date } = req.body || {};

  if (!DEPARTMENTS.includes(department)) {
    return res.status(400).json({ ok: false, error: "Please select a valid clinic department." });
  }

  const parsedDate = typeof date === "string" ? new Date(`${date}T00:00:00.000Z`) : null;
  if (
    !parsedDate ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date ||
    date < new Date().toISOString().slice(0, 10)
  ) {
    return res.status(400).json({ ok: false, error: "Please choose a valid date that is not in the past." });
  }

  const id = `a-${randomUUID()}`;
  const result = await pool.query(
    "INSERT INTO appointments (id, artisan_id, department, date) VALUES ($1, $2, $3, $4) RETURNING *",
    [id, req.session.user.id, department, date]
  );

  const appointment = result.rows[0];
  res.status(201).json({ ok: true, appointment: toAppointment(appointment) });
}));

module.exports = router;
