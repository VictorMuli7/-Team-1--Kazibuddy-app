const express = require("express");
const db = require("../db");
const { asyncHandler } = require("../middleware");

const router = express.Router();

/* Shapes a raw users-table row into the ArtisanPublic contract shape —
   deliberately narrower than toPublicUser() in routes/auth.js: no email,
   no account status. This is the judgment call flagged in openapi.yaml —
   confirm with the team it's the right one before relying on it. */
function toArtisanPublic(row) {
    if (!row) return null;
    return {
        id: row.id,
        fullname: row.fullname,
        phone: row.phone,
        skill: row.skill,
        verified: !!row.verified,
        bio: row.bio,
        rate: row.rate,
        blood_type: row.blood_type,
        rhesus_factor: row.rhesus_factor,

    };
}

/* ---------- GET /api/artisans ---------- */
/* Public — no session required. Matches ENDPOINT_LIST.md: "The organ
   donation app needs to read verified artisans and their services."
   Defaults to verified-only unless ?verified=false is passed explicitly,
   since the need statement specifically says "verified artisans". */
router.get("/", asyncHandler(async (req, res) => {
    const { skill, verified } = req.query;

    const verifiedFilter = verified === undefined ? true : verified === "true";
    const params = [verifiedFilter];
    let sql = "SELECT * FROM users WHERE role = 'artisan' AND verified = $1";

    if (skill) {
        params.push(skill);
        sql += ` AND lower(skill) = lower($${params.length})`;
    }

    sql += " ORDER BY fullname ASC";

    const { rows } = await db.query(sql, params);
    res.json({ ok: true, artisans: rows.map(toArtisanPublic) });
}));

/* ---------- GET /api/artisans/:id ---------- */
router.get("/:id", asyncHandler(async (req, res) => {
    const { rows } = await db.query(
        "SELECT * FROM users WHERE id = $1 AND role = 'artisan'",
        [req.params.id]
    );

    if (!rows[0]) {
        return res.status(404).json({ ok: false, error: "Artisan not found." });
    }

    res.json({ ok: true, artisan: toArtisanPublic(rows[0]) });
}));

module.exports = router;
