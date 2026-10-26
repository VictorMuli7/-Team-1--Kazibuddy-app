const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const SqliteStore = require("better-sqlite3-session-store")(session);
const cors = require("cors");
const db = require("./db");
const hospitalQRoutes = require("./routes/hospitalq");

const { router: authRouter } = require("./routes/auth");
const usersRouter = require("./routes/users");
const bookingsRouter = require("./routes/bookings");
const appointmentsRouter = require("./routes/appointments");
const reviewsRouter = require("./routes/reviews");
const artisansRouter = require("./routes/artisans");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = [
  path.join(__dirname, "..", "client", "dist"),
  path.join(__dirname, "..", "client", "public"),
  path.join(__dirname, ".."),
].find((dir) => fs.existsSync(dir)) || path.join(__dirname, "..");
const SESSION_SECRET = process.env.SESSION_SECRET || "juakali-dev-secret-change-me";

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "http://localhost:3001",
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  session({
    store: new SqliteStore({
      client: db,
      expired: { clear: true, intervalMs: 15 * 60 * 1000 },
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

app.use("/api/partners/hospitalq", hospitalQRoutes);

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/artisans", artisansRouter);

app.use(express.static(PUBLIC_DIR));

app.get(/^(?!\/api).*/, (req, res, next) => {
  const indexFile = path.join(PUBLIC_DIR, "index.html");
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }

  next();
});

app.listen(PORT, () => {
  console.log(`Jua Kali server running at http://localhost:${PORT}`);
  console.log(`Database file: ${path.join(__dirname, "juakali.db")}`);
});
