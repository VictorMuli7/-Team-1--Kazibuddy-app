// API key authentication and in-memory per-key rate limiting.
// API_KEYS is a comma-separated list of long random keys stored in server/.env.
const VALID_KEYS = new Set(
    (process.env.API_KEYS || "").split(",").map((key) => key.trim()).filter(Boolean)
);

function requireApiKey(req, res, next) {
    const key = req.get("X-API-Key");
    if (!key || !VALID_KEYS.has(key)) {
        return res.status(401).json({ ok: false, error: "Missing or invalid API key." });
    }
    req.apiKey = key;
    return next();
}

function rateLimit({ windowMs = 60_000, max = 100 } = {}) {
    const hits = new Map();
    return (req, res, next) => {
        const id = req.apiKey || req.ip;
        const now = Date.now();
        let entry = hits.get(id);
        if (!entry || now >= entry.resetAt) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(id, entry);
        }
        entry.count += 1;
        if (entry.count > max) {
            const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
            res.set("Retry-After", String(retryAfter));
            return res.status(429).json({
                ok: false,
                error: "Too many requests.",
                retryAfter,
            });
        }
        return next();
    };
}

module.exports = { requireApiKey, rateLimit };