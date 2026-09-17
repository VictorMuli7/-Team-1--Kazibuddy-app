const express = require("express");
const db = require("../db");

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
    };
}

/* ---------- GET /api/artisans ---------- */
/* Public — no session required. Matches ENDPOINT_LIST.md: "The organ
   donation app needs to read verified artisans and their services."
   Defaults to verified-only unless ?verified=false is passed explicitly,
   since the need statement specifically says "verified artisans". */
router.get("/", (req, res) => {
    const { skill, verified } = req.query;

    let sql = "SELECT * FROM users WHERE role = 'artisan'";
    const params = [];

    const verifiedFilter = verified === undefined ? true : verified === "true";
    sql += " AND verified = ?";
    params.push(verifiedFilter ? 1 : 0);

    if (skill) {
        sql += " AND lower(skill) = lower(?)";
        params.push(skill);
    }

    sql += " ORDER BY fullname ASC";

    const rows = db.prepare(sql).all(...params);
    res.json({ ok: true, artisans: rows.map(toArtisanPublic) });
});

/* ---------- GET /api/artisans/:id ---------- */
router.get("/:id", (req, res) => {
    const row = db
        .prepare("SELECT * FROM users WHERE id = ? AND role = 'artisan'")
        .get(req.params.id);

    if (!row) {
        return res.status(404).json({ ok: false, error: "Artisan not found." });
    }

    res.json({ ok: true, artisan: toArtisanPublic(row) });
});

module.exports = router;
