require("dotenv").config({ quiet: true });

const path = require("path");
const express = require("express");
const session = require("express-session");
const PgStore = require("connect-pg-simple")(session);
const cors = require("cors");
const { pool, initDb } = require("./db");
const { parseApiKeys, requireApiKey, requireScope, rateLimit } = require("./middleware/apiSecurity");

const app = express();

const hospitalQRoutes = require("./routes/hospitalQ");

const { router: authRouter } = require("./routes/auth");
const usersRouter = require("./routes/users");
const bookingsRouter = require("./routes/bookings");
const appointmentsRouter = require("./routes/appointments");
const reviewsRouter = require("./routes/reviews");
const artisansRouter = require("./routes/artisans");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "..", "web_dev-main");

// Render sets RENDER=true on its services; NODE_ENV=production covers other hosts.
const isProd = process.env.NODE_ENV === "production" || !!process.env.RENDER;
if (isProd && !process.env.SESSION_SECRET) {
  console.error("SESSION_SECRET is not set. Refusing to start in production with the built-in default secret.");
  process.exit(1);
}
const consumers = parseApiKeys();
console.log(`API keys loaded: ${consumers.length} (${consumers.map((consumer) => `${consumer.label}/${consumer.scope}`).join(", ") || "none"})`);
if (!consumers.length) {
  console.warn("WARNING: no API keys configured (API_KEYS). Every /api request will be rejected with 401.");
}

// On Render the app sits behind a proxy that terminates HTTPS. Without this,
// Express thinks the request is plain HTTP and refuses to set a "secure" cookie.
if (isProd) app.set("trust proxy", 1);

// CORS_ORIGIN = comma-separated list of frontend URLs allowed to call the API,
// e.g. https://your-app.vercel.app  (leave unset to allow any origin).
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true,
  exposedHeaders: ["Retry-After", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
}));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api", requireApiKey(consumers));
app.use("/api", rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
}));

app.use(express.json({ limit: "100kb" }));

app.use(
  session({
    // Sessions live in a "session" table in the same PostgreSQL database.
    store: new PgStore({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || "juakali-dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      // Vercel (frontend) and Render (backend) are different sites, so the
      // browser only sends the login cookie if it is SameSite=None + Secure.
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
    },
  })
);

app.use("/api/partners/hospitalq", requireScope("web"), hospitalQRoutes);
app.use("/api/auth", requireScope("web"), authRouter);
app.use("/api/users", requireScope("web"), usersRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/appointments", requireScope("web"), appointmentsRouter);
app.use("/api/reviews", requireScope("web"), reviewsRouter);
app.use("/api/artisans", requireScope("partner"), artisansRouter);

app.use("/api", (req, res) => res.status(404).json({ ok: false, error: "Not found." }));

// Serve the frontend (index.html, css/, js/, assets/) as static files
app.use(express.static(PUBLIC_DIR));

// Last-resort error handler: database/driver errors from async routes land here.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ ok: false, error: "Request body is not valid JSON." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ ok: false, error: "Request body is too large." });
  }
  console.error(err);
  res.status(500).json({ ok: false, error: "Something went wrong on the server. Please try again." });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Jua Kali server running at http://localhost:${PORT}`);
      console.log("Database: PostgreSQL");
    });
  })
  .catch((err) => {
    console.error("Could not connect to / set up PostgreSQL:", err.message);
    console.error("Check DATABASE_URL in server/.env (see .env.example).");
    process.exit(1);
  });
