/* ============================================================
   Jua Kali — SQLite database layer
   Replaces the old localStorage "fake database" with a real
   file-based SQLite database via better-sqlite3.
   ============================================================ */

const path = require("path");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "juakali.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    role          TEXT NOT NULL CHECK (role IN ('admin','customer','artisan')),
    fullname      TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    phone         TEXT,
    password_hash TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'active',
    joined        TEXT NOT NULL,
    skill         TEXT,
    verified      INTEGER NOT NULL DEFAULT 0,
    bio           TEXT,
    rate          TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id            TEXT PRIMARY KEY,
    customer_id   TEXT NOT NULL REFERENCES users(id),
    service       TEXT NOT NULL,
    artisan_id    TEXT NOT NULL REFERENCES users(id),
    date          TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending',
    price         TEXT
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    category      TEXT NOT NULL,
    stars         INTEGER NOT NULL,
    date          TEXT NOT NULL,
    text          TEXT NOT NULL
  );
`);

/* ---------- Seed once, only if the users table is empty ---------- */
function seedIfNeeded() {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM users").get();
  if (count > 0) return;

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (id, role, fullname, email, phone, password_hash, status, joined, skill, verified, bio, rate)
    VALUES (@id, @role, @fullname, @email, @phone, @password_hash, @status, @joined, @skill, @verified, @bio, @rate)
  `);

  const users = [
    { id: "u-admin",    role: "admin",    fullname: "Grace Mwangi",   email: "admin@juakali.com",       phone: "+254 700 000 001", password_hash: hash("admin123"),    status: "active",    joined: "2024-01-10", skill: null,           verified: 0, bio: null, rate: null },
    { id: "u-customer", role: "customer", fullname: "Brian Otieno",   email: "customer@juakali.com",    phone: "+254 700 000 002", password_hash: hash("customer123"), status: "active",    joined: "2024-03-02", skill: null,           verified: 0, bio: null, rate: null },
    { id: "u-artisan",  role: "artisan",  fullname: "Faith Wanjiru",  email: "artisan@juakali.com",     phone: "+254 700 000 003", password_hash: hash("artisan123"),  status: "active",    joined: "2024-02-14", skill: "Hair Styling", verified: 1, bio: "Braids, perms, treatments and cuts. 6 years experience, home visits available.", rate: "From KES 500/style" },
    { id: "u-a2",       role: "artisan",  fullname: "Peter Kamau",    email: "peter.kamau@example.com", phone: "+254 711 000 004", password_hash: hash("pass1234"),    status: "pending",   joined: "2025-06-20", skill: "Plumbing",     verified: 0, bio: "Pipe installation, leak repairs and blockages.", rate: "From KES 700/hr" },
    { id: "u-a3",       role: "artisan",  fullname: "Mercy Achieng",  email: "mercy.a@example.com",     phone: "+254 722 000 005", password_hash: hash("pass1234"),    status: "active",    joined: "2024-11-05", skill: "Electrical",   verified: 1, bio: "Licensed electrician, wiring and fault-finding.", rate: "From KES 500/hr" },
    { id: "u-c2",       role: "customer", fullname: "Samuel Njoroge", email: "samuel.n@example.com",    phone: "+254 733 000 006", password_hash: hash("pass1234"),    status: "active",    joined: "2025-01-18", skill: null,           verified: 0, bio: null, rate: null },
    { id: "u-c3",       role: "customer", fullname: "Lucy Wambui",    email: "lucy.w@example.com",      phone: "+254 744 000 007", password_hash: hash("pass1234"),    status: "suspended", joined: "2025-04-09", skill: null,           verified: 0, bio: null, rate: null },
  ];
  const insertUsers = db.transaction((rows) => rows.forEach((u) => insertUser.run(u)));
  insertUsers(users);

  const insertBooking = db.prepare(`
    INSERT INTO bookings (id, customer_id, service, artisan_id, date, status, price)
    VALUES (@id, @customer_id, @service, @artisan_id, @date, @status, @price)
  `);
  const bookings = [
    { id: "b1", customer_id: "u-customer", service: "Hair Styling", artisan_id: "u-artisan", date: "2026-07-14", status: "upcoming",  price: "KES 500" },
    { id: "b2", customer_id: "u-customer", service: "Plumbing",     artisan_id: "u-a2",      date: "2026-06-30", status: "completed", price: "KES 700" },
    { id: "b3", customer_id: "u-c2",       service: "Hair Styling", artisan_id: "u-artisan", date: "2026-07-17", status: "pending",   price: "KES 500" },
    { id: "b4", customer_id: "u-c2",       service: "Electrical",   artisan_id: "u-a3",      date: "2026-06-20", status: "completed", price: "KES 1,500" },
    { id: "b5", customer_id: "u-c3",       service: "Hair Styling", artisan_id: "u-artisan", date: "2026-07-20", status: "pending",   price: "KES 500" },
  ];
  const insertBookings = db.transaction((rows) => rows.forEach((b) => insertBooking.run(b)));
  insertBookings(bookings);

  const insertReview = db.prepare(`
    INSERT INTO reviews (name, category, stars, date, text) VALUES (@name, @category, @stars, @date, @text)
  `);
  const reviews = [
    { name: "Amina W.",     category: "Laundry",      stars: 5, date: "2025-06-20", text: "Absolutely fantastic! My clothes came back perfectly clean and ironed. The pickup and delivery was on time. I'll definitely use this service again." },
    { name: "Brian O.",     category: "Plumbing",     stars: 5, date: "2025-06-18", text: "Fixed a stubborn leak under my sink in under an hour. Very professional and the price was fair. Highly recommend!" },
    { name: "Grace M.",     category: "Hair Styling", stars: 4, date: "2025-06-15", text: "Lovely braiding work. Took a bit longer than expected but the result was beautiful. Will book again." },
    { name: "David K.",     category: "Electrical",   stars: 5, date: "2025-06-12", text: "Sorted out my faulty wiring safely and quickly. The electrician explained everything clearly. Very satisfied." },
    { name: "Fatuma A.",    category: "Cleaning",     stars: 5, date: "2025-06-10", text: "My office has never looked this spotless. The team was thorough and professional. Booking regularly from now on." },
    { name: "James N.",     category: "Barber",       stars: 5, date: "2025-06-08", text: "Best fade I've had in years. The barber came to my house which was super convenient. 10/10!" },
    { name: "Wanjiru P.",   category: "Cooking",      stars: 4, date: "2025-06-05", text: "Prepared a lovely three-course dinner for a family gathering. Everyone loved the food. Will use again for our next event." },
    { name: "Samuel L.",    category: "Gardening",    stars: 5, date: "2025-06-02", text: "Transformed my overgrown yard into a beautiful garden. Hardworking and creative. Could not be happier!" },
    { name: "Celestine R.", category: "Laundry",      stars: 5, date: "2025-05-30", text: "Used the service three times now. Consistent quality every time. My go-to laundry solution." },
    { name: "Michael A.",   category: "Electrical",   stars: 3, date: "2025-05-27", text: "Work was done correctly but took longer than quoted. Would appreciate better time estimates upfront." },
    { name: "Halima S.",    category: "Hair Styling", stars: 5, date: "2025-05-25", text: "Incredible box braids done at home! Saved me the trip to the salon and the stylist was so gentle and skilled." },
    { name: "Peter M.",     category: "Plumbing",     stars: 4, date: "2025-05-22", text: "Good work replacing bathroom fixtures. The plumber was polite and cleaned up after. Minor delay but overall great." },
    { name: "Nancy G.",     category: "Cleaning",     stars: 5, date: "2025-05-19", text: "Deep cleaned my entire apartment before moving in. Every corner was spotless. Worth every shilling!" },
    { name: "Tom O.",       category: "Barber",       stars: 5, date: "2025-05-17", text: "Precise cut, great conversation. This is convenience at its finest. I've told all my friends about Jua Kali." },
    { name: "Aisha K.",     category: "Cooking",      stars: 5, date: "2025-05-14", text: "Hired a chef for my parents' anniversary dinner. The food was restaurant-quality and the presentation was amazing." },
    { name: "Collins O.",   category: "Gardening",    stars: 4, date: "2025-05-10", text: "Reliable gardener who maintains my lawn every two weeks. Always leaves it looking neat and tidy." },
  ];
  const insertReviews = db.transaction((rows) => rows.forEach((r) => insertReview.run(r)));
  insertReviews(reviews);

  console.log("Database seeded with initial demo data.");
}

seedIfNeeded();

module.exports = db;
