require("dotenv").config({ quiet: true });

const path = require("path");
const express = require("express");
const session = require("express-session");
const PgStore = require("connect-pg-simple")(session);
const cors = require("cors");
const { pool, initDb } = require("./db");

const app = express();

const hospitalQRoutes = require("./routes/hospitalQ");

app.use(express.json());

app.use("/api/partners/hospitalq", hospitalQRoutes);

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

// On Render the app sits behind a proxy that terminates HTTPS. Without this,
// Express thinks the request is plain HTTP and refuses to set a "secure" cookie.
if (isProd) app.set("trust proxy", 1);

// CORS_ORIGIN = comma-separated list of frontend URLs allowed to call the API,
// e.g. https://your-app.vercel.app  (leave unset to allow any origin).
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true, credentials: true }));
app.use(express.json());

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

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/artisans", artisansRouter);

// Serve the frontend (index.html, css/, js/, assets/) as static files
app.use(express.static(PUBLIC_DIR));

// Last-resort error handler: database/driver errors from async routes land here.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
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
