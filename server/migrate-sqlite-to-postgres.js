const path = require("path");
const Database = require("better-sqlite3");
const { pool, initializeDatabase } = require("./db");

const args = process.argv.slice(2);
const merge = args.includes("--merge");
const sourcePath = args.find((arg) => arg !== "--merge") || path.join(__dirname, "juakali.db");
const tables = {
  users: [
    "id", "role", "fullname", "email", "phone", "password_hash", "status",
    "joined", "skill", "verified", "bio", "rate", "blood_type", "rhesus_factor",
  ],
  bookings: ["id", "customer_id", "service", "artisan_id", "date", "status", "price"],
  appointments: ["id", "artisan_id", "department", "date", "status", "created_at"],
  reviews: ["id", "name", "category", "stars", "date", "text"],
};

async function migrate() {
  const sqlite = new Database(sourcePath, { readonly: true, fileMustExist: true });

  try {
    await initializeDatabase();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      for (const table of Object.keys(tables)) {
        const { rows } = await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
        if (rows[0].count > 0 && !merge) {
          throw new Error(`PostgreSQL table "${table}" is not empty; refusing to import to avoid conflicts.`);
        }
      }

      for (const [table, columns] of Object.entries(tables)) {
        const sourceRows = sqlite.prepare(`SELECT * FROM ${table}`).all();
        const sourceColumns = new Set(sqlite.prepare(`PRAGMA table_info(${table})`).all().map(({ name }) => name));
        const availableColumns = columns.filter((column) => sourceColumns.has(column));
        const placeholders = availableColumns.map((_, index) => `$${index + 1}`).join(", ");
        const conflictClause = merge ? " ON CONFLICT DO NOTHING" : "";
        const statement = `INSERT INTO ${table} (${availableColumns.join(", ")}) VALUES (${placeholders})${conflictClause}`;
        let imported = 0;

        for (const sourceRow of sourceRows) {
          const values = availableColumns.map((column) => {
            const value = sourceRow[column];
            return table === "users" && column === "verified" ? Boolean(value) : value;
          });
          const result = await client.query(statement, values);
          imported += result.rowCount;
        }
        console.log(`Imported ${imported} of ${sourceRows.length} ${table} row(s); skipped ${sourceRows.length - imported}.`);
      }

      await client.query(`
        SELECT setval(
          pg_get_serial_sequence('reviews', 'id'),
          COALESCE((SELECT MAX(id) FROM reviews), 1),
          EXISTS (SELECT 1 FROM reviews)
        )
      `);
      await client.query("COMMIT");
      console.log(`SQLite data from "${sourcePath}" was migrated successfully${merge ? " (conflicts skipped)" : ""}.`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } finally {
    sqlite.close();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error("SQLite-to-PostgreSQL migration failed:", error);
  process.exitCode = 1;
});
