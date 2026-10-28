const express = require("express");
const { randomUUID } = require("crypto");
const db = require("../db");
const { requireRole, asyncHandler } = require("../middleware");
const hospitalQ = require("../services/hospitalQService");

const router = express.Router();
const DEPARTMENTS = ["General OPD", "Dental", "Pediatrics"];

// Our department names -> the names HospitalQ uses.
// IMPORTANT: check these against their GET /api/departments response
// and change the right-hand side if they are different.
const HOSPITALQ_DEPARTMENTS = {
  "General OPD": "general-opd",
  "Dental": "dental",
  "Pediatrics": "pediatrics",
};

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
  const { rows } = await db.query(
    "SELECT * FROM appointments WHERE artisan_id = $1 ORDER BY date DESC, created_at DESC",
    [req.session.user.id]
  );

  res.json({ ok: true, appointments: rows.map(toAppointment) });
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

  // 1. Send the request to HospitalQ first.
  //    If this fails we stop, so our database never holds an appointment
  //    that the hospital does not know about.
  let hospitalResult;
  try {
    hospitalResult = await hospitalQ.checkIn(
      req.session.user.fullname,
      HOSPITALQ_DEPARTMENTS[department]
    );
  } catch (error) {
    console.error("HospitalQ check-in failed:", error.message);
    return res.status(502).json({
      ok: false,
      error: "We could not reach the hospital system. Please try again.",
    });
  }

  // 2. Save our own copy.
  const id = `a-${randomUUID()}`;
  const { rows } = await db.query(
    "INSERT INTO appointments (id, artisan_id, department, date) VALUES ($1, $2, $3, $4) RETURNING *",
    [id, req.session.user.id, department, date]
  );

  res.status(201).json({
    ok: true,
    appointment: toAppointment(rows[0]),
    hospitalQ: hospitalResult,
  });
}));

module.exports = router;
