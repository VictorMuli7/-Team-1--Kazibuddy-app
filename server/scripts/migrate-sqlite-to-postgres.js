/* One-off helper: copies the data from the old SQLite file (juakali.db)
   into PostgreSQL. Run it ONCE, against an empty database, before the first
   `npm start`:

       npm run migrate:sqlite                    # uses ./juakali.db
       npm run migrate:sqlite -- path/to/old.db  # or point at another file

   Needs Node 22.13+ (uses the built-in node:sqlite module, so there is no
   SQLite dependency to install). Login sessions are not copied — everyone
   just signs in again. */

require("dotenv").config({ quiet: true });

const path = require("path");
const fs = require("fs");

let DatabaseSync;
try {
  ({ DatabaseSync } = require("node:sqlite"));
} catch {
  console.error("This script needs Node 22.13 or newer (built-in node:sqlite). Your Node is " + process.version + ".");
  process.exit(1);
}

const { pool, initSchema, withInitLock } = require("../db");

const sqlitePath = path.resolve(process.argv[2] || path.join(__dirname, "..", "juakali.db"));

async function main() {
  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`SQLite file not found: ${sqlitePath}`);
  }
  const src = new DatabaseSync(sqlitePath, { readOnly: true });
  const all = (sql) => src.prepare(sql).all().map((row) => ({ ...row }));

  const users = all("SELECT * FROM users");
  const bookings = all("SELECT * FROM bookings");
  const appointments = all("SELECT * FROM appointments");
  const reviews = all("SELECT * FROM reviews ORDER BY id");

  const counts = await withInitLock(async (client) => {
    await initSchema(client);

    const { rows } = await client.query("SELECT COUNT(*)::int AS n FROM users");
    if (rows[0].n > 0) {
      throw new Error("The PostgreSQL database already has users in it. Run this against a fresh, empty database.");
    }

    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, role, fullname, email, phone, password_hash, status, joined, skill, verified, bio, rate, blood_type, rhesus_factor)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [u.id, u.role, u.fullname, u.email, u.phone, u.password_hash, u.status, u.joined, u.skill,
         !!u.verified, u.bio, u.rate, u.blood_type ?? null, u.rhesus_factor ?? null]
      );
    }
    for (const b of bookings) {
      await client.query(
        `INSERT INTO bookings (id, customer_id, service, artisan_id, date, status, price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [b.id, b.customer_id, b.service, b.artisan_id, b.date, b.status, b.price]
      );
    }
    for (const a of appointments) {
      // SQLite stores CURRENT_TIMESTAMP as UTC "YYYY-MM-DD HH:MM:SS"
      const createdAt = a.created_at ? new Date(a.created_at.replace(" ", "T") + "Z") : new Date();
      await client.query(
        `INSERT INTO appointments (id, artisan_id, department, date, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [a.id, a.artisan_id, a.department, a.date, a.status, createdAt]
      );
    }
    for (const r of reviews) {
      await client.query(
        "INSERT INTO reviews (id, name, category, stars, date, text) VALUES ($1, $2, $3, $4, $5, $6)",
        [r.id, r.name, r.category, r.stars, r.date, r.text]
      );
    }
    // Explicit ids were inserted, so move the identity counter past them.
    await client.query(
      "SELECT setval(pg_get_serial_sequence('reviews', 'id'), COALESCE((SELECT MAX(id) FROM reviews), 1), (SELECT COUNT(*) > 0 FROM reviews))"
    );

    return { users: users.length, bookings: bookings.length, appointments: appointments.length, reviews: reviews.length };
  });

  src.close();
  console.log(`Copied from ${sqlitePath}:`, counts);
}

main()
  .catch((err) => {
    console.error("Migration failed (nothing was written):", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
