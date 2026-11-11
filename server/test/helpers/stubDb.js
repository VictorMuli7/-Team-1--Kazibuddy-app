/* Test helper: replaces ../db with an in-memory stand-in so the API can run
   without PostgreSQL. Works two ways:
     - require("./helpers/stubDb") inside a test, or
     - node -r ./test/helpers/stubDb.js server.js   (preload, for snapshots)
   Only the two queries the artisan routes make are understood. */
const path = require("path");

const ARTISANS = [
  { id: "a-100", role: "artisan", fullname: "Amina Wanjiru", phone: "0711000001", skill: "Plumbing",
    verified: true, bio: "Ten years fixing pipes.", rate: "KES 1500/hr", blood_type: "O", rhesus_factor: "positive" },
  { id: "a-200", role: "artisan", fullname: "Brian Otieno", phone: "0711000002", skill: "Electrician",
    verified: true, bio: "Wiring and repairs.", rate: "KES 1800/hr", blood_type: "A", rhesus_factor: "negative" },
  { id: "a-300", role: "artisan", fullname: "Cynthia Achieng", phone: "0711000003", skill: "Plumbing",
    verified: false, bio: "New on the platform.", rate: "KES 1200/hr", blood_type: null, rhesus_factor: null },
];

async function query(sql, params = []) {
  if (/FROM users WHERE role = 'artisan' AND verified = \$1/.test(sql)) {
    let rows = ARTISANS.filter((r) => r.verified === params[0]);
    if (/lower\(skill\) = lower\(\$2\)/.test(sql)) {
      rows = rows.filter((r) => r.skill.toLowerCase() === String(params[1]).toLowerCase());
    }
    return { rows: [...rows].sort((a, b) => a.fullname.localeCompare(b.fullname)) };
  }
  if (/FROM users WHERE id = \$1 AND role = 'artisan'/.test(sql)) {
    return { rows: ARTISANS.filter((r) => r.id === params[0]) };
  }
  return { rows: [] };
}

const pool = {
  query: (sql, params, cb) => {
    if (typeof params === "function") { cb = params; params = []; }
    const p = query(sql, params);
    if (cb) { p.then((r) => cb(null, r), cb); return undefined; }
    return p;
  },
  connect: async () => ({ query, release() {} }),
  on() {},
  end: async () => {},
};

const dbPath = path.resolve(__dirname, "..", "..", "db.js");
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true,
  exports: { pool, query, initDb: async () => {} },
};

module.exports = { ARTISANS };
