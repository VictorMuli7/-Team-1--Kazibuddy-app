const crypto = require("crypto");

const sha256 = (value) => crypto.createHash("sha256").update(String(value)).digest();
const SCOPES = ["partner", "web"];

function parseApiKeys(env = process.env) {
  const consumers = [];
  const add = (label, scope, key, limit) => {
    if (!key || !SCOPES.includes(scope)) return;
    consumers.push({
      id: consumers.length,
      label,
      scope,
      digest: sha256(key),
      limit: Number.isInteger(limit) && limit > 0 ? limit : undefined,
    });
  };

  (env.API_KEYS || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry, index) => {
      const [label, scope, key, limit] = entry.split(":");
      if (key === undefined) {
        add(`consumer-${index + 1}`, "partner", label);
      } else {
        add(label, scope, key, parseInt(limit, 10));
      }
    });

  (env.PARTNER_API_KEYS || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean)
    .forEach((key, index) => add(`partner-${index + 1}`, "partner", key));

  return consumers;
}

function requireApiKey(consumers) {
  return (req, res, next) => {
    const provided = req.get("X-API-Key");
    let match = null;
    if (provided) {
      const digest = sha256(provided);
      for (const consumer of consumers) {
        if (crypto.timingSafeEqual(digest, consumer.digest) && !match) match = consumer;
      }
    }
    if (!match) {
      return res.status(401).json({ ok: false, error: "Missing or invalid API key." });
    }
    req.apiConsumer = match;
    next();
  };
}

function requireScope(scope) {
  return (req, res, next) => {
    if (!req.apiConsumer || req.apiConsumer.scope !== scope) {
      return res.status(403).json({ ok: false, error: "This API key is not allowed to use this endpoint." });
    }
    next();
  };
}

function rateLimit({ windowMs = 60000, max = 100 } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const consumer = req.apiConsumer;
    const id = consumer ? consumer.id : req.ip;
    const limit = (consumer && consumer.limit) || max;
    const now = Date.now();

    let entry = hits.get(id);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(id, entry);
    }
    entry.count += 1;

    res.set("X-RateLimit-Limit", String(limit));
    res.set("X-RateLimit-Remaining", String(Math.max(0, limit - entry.count)));

    if (entry.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({ ok: false, error: "Too many requests. Please slow down.", retryAfter });
    }
    next();
  };
}

module.exports = { parseApiKeys, requireApiKey, requireScope, rateLimit };
