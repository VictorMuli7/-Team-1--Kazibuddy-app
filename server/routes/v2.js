/* v2: the new shape. Same data as v1, different response.
   Changes from v1 (all breaking, announced in DEPRECATION_NOTICE.md):
     1. The list moves from  { ok, artisans: [...] }  to  { ok, data: [...], count }
        (a count now, room for paging later without another break)
     2. "fullname" is renamed "name"
     3. A single artisan moves from { ok, artisan: {...} } to { ok, data: {...} }
   Nothing else changes: ids, phone, skill, verified, bio, rate, blood group
   fields, the ?skill= and ?verified= filters, status codes, the API key. */
const express = require("express");
const db = require("../db");
const { asyncHandler } = require("../middleware");
const { requireScope } = require("../middleware/apiSecurity");

const router = express.Router();

// The ONE place that turns a users-table row into the v2 response shape.
function toV2(row) {
    return {
        id: row.id,
        name: row.fullname, // renamed: was "fullname" in v1
        phone: row.phone,
        skill: row.skill,
        verified: !!row.verified,
        bio: row.bio,
        rate: row.rate,
        blood_type: row.blood_type,
        rhesus_factor: row.rhesus_factor,
    };
}

router.use("/artisans", requireScope("partner"));

/* ---------- GET /api/v2/artisans ---------- */
router.get("/artisans", asyncHandler(async (req, res) => {
    const { skill, verified } = req.query;

    // Same default as v1: verified artisans only unless ?verified=false is explicit.
    const verifiedFilter = verified === undefined ? true : verified === "true";
    const params = [verifiedFilter];
    let sql = "SELECT * FROM users WHERE role = 'artisan' AND verified = $1";

    if (skill) {
        params.push(skill);
        sql += ` AND lower(skill) = lower($${params.length})`;
    }

    sql += " ORDER BY fullname ASC";

    const { rows } = await db.query(sql, params);
    res.json({ ok: true, data: rows.map(toV2), count: rows.length }); // was { artisans: [...] }
}));

/* ---------- GET /api/v2/artisans/:id ---------- */
router.get("/artisans/:id", asyncHandler(async (req, res) => {
    const { rows } = await db.query(
        "SELECT * FROM users WHERE id = $1 AND role = 'artisan'",
        [req.params.id]
    );

    if (!rows[0]) {
        return res.status(404).json({ ok: false, error: "Artisan not found." }); // same error shape as v1
    }

    res.json({ ok: true, data: toV2(rows[0]) });
}));

module.exports = router;
