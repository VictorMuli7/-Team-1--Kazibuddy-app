require("dotenv").config({ quiet: true });

const { initDb } = require("./db");
const app = require("./app");

const PORT = process.env.PORT || 3000;

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
