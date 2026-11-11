/* v1: FROZEN. Do not change the shape of anything this router returns.
   The handlers themselves still live, untouched, in routes/artisans.js
   (not moved, not edited). This file only wraps them with the deprecation
   headers, so v1 behaves exactly as before plus three headers.

   Mounted twice in app.js:
     /api/v1/artisans   the explicit, versioned URL
     /api/artisans      the old unversioned URL. Existing callers (the organ
                        donation app) use this one, so it MUST keep working. */
const express = require("express");
const { requireScope } = require("../middleware/apiSecurity");
const { deprecated, V1_SUNSET } = require("../middleware/deprecate");
const artisansRouter = require("./artisans");

const router = express.Router();
const old = deprecated({ sunset: V1_SUNSET, successor: "/api/v2/artisans" });

// Prefix-scoped on purpose: only artisan URLs get the headers, never /api/users etc.
router.use("/artisans", old, requireScope("partner"), artisansRouter);

module.exports = router;
