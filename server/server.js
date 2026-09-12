const path = require("path");
const express = require("express");
const session = require("express-session");
const SqliteStore = require("better-sqlite3-session-store")(session);
const cors = require("cors");
const db = require("./db");

const { router: authRouter } = require("./routes/auth");
const usersRouter = require("./routes/users");
const bookingsRouter = require("./routes/bookings");
const reviewsRouter = require("./routes/reviews");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "..", "web_dev-main");

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(
  session({
    store: new SqliteStore({ client: db, expired: { clear: true, intervalMs: 15 * 60 * 1000 } }),
    secret: process.env.SESSION_SECRET || "juakali-dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    },
  })
);

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/reviews", reviewsRouter);

// Serve the frontend (index.html, css/, js/, assets/) as static files
app.use(express.static(PUBLIC_DIR));

app.listen(PORT, () => {
  console.log(`Jua Kali server running at http://localhost:${PORT}`);
  console.log(`Database file: ${path.join(__dirname, "juakali.db")}`);
});
