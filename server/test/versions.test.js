/* Week 13: v1 is frozen, v2 has the new shape, v1 announces its sunset.
   Runs without PostgreSQL: test/helpers/stubDb.js stands in for ../db. */
process.env.API_KEYS = "partner:partner:test-key,website:web:web-key";

const test = require("node:test");
const assert = require("node:assert/strict");
const { ARTISANS } = require("./helpers/stubDb"); // must load before ../app
const app = require("../app");
const { V1_SUNSET } = require("../middleware/deprecate");

const KEY = { "X-API-Key": "test-key" };
let server;
let base;

test.before(async () => {
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => { server.close(); setImmediate(() => process.exit(0)); }); // session store keeps a timer alive

const get = (path, headers = KEY) => fetch(base + path, { headers });

test.describe("v1 is frozen", () => {
  test("GET /api/v1/artisans keeps its original shape", async () => {
    const res = await get("/api/v1/artisans");
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(body).sort(), ["artisans", "ok"]);
    assert.ok(Array.isArray(body.artisans));
    assert.deepEqual(Object.keys(body.artisans[0]).sort(), [
      "bio", "blood_type", "fullname", "id", "phone", "rate", "rhesus_factor", "skill", "verified",
    ]);
  });

  test("old unversioned /api/artisans still answers exactly like v1", async () => {
    const a = await get("/api/artisans");
    const b = await get("/api/v1/artisans");
    assert.equal(a.status, 200);
    assert.deepEqual(await a.json(), await b.json());
  });

  test("single artisan keeps { ok, artisan }", async () => {
    const res = await get("/api/artisans/a-100");
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(body).sort(), ["artisan", "ok"]);
    assert.equal(body.artisan.fullname, "Amina Wanjiru");
  });

  test("v1 error shape is unchanged", async () => {
    const res = await get("/api/v1/artisans/nope");
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { ok: false, error: "Artisan not found." });
  });

  test("v1 filters still work", async () => {
    const res = await get("/api/artisans?skill=plumbing&verified=false");
    const body = await res.json();
    assert.deepEqual(body.artisans.map((a) => a.id), ["a-300"]);
  });
});

test.describe("v2 has the new shape", () => {
  test("list is wrapped with a count, and uses name instead of fullname", async () => {
    const res = await get("/api/v2/artisans");
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(body).sort(), ["count", "data", "ok"]);
    assert.equal(body.count, 2);
    assert.deepEqual(Object.keys(body.data[0]).sort(), [
      "bio", "blood_type", "id", "name", "phone", "rate", "rhesus_factor", "skill", "verified",
    ]);
    assert.equal(body.data[0].name, "Amina Wanjiru");
  });

  test("v2 carries the same data as v1", async () => {
    const v1 = (await (await get("/api/v1/artisans")).json()).artisans;
    const v2 = (await (await get("/api/v2/artisans")).json()).data;
    assert.deepEqual(v2.map(({ name, ...rest }) => ({ fullname: name, ...rest })), v1);
  });

  test("filters still work", async () => {
    const res = await get("/api/v2/artisans?skill=Plumbing");
    const body = await res.json();
    assert.deepEqual(body.data.map((a) => a.id), ["a-100"]);
    assert.equal(body.count, 1);
  });

  test("single artisan is { ok, data }, and 404 keeps the v1 error shape", async () => {
    const one = await (await get("/api/v2/artisans/a-200")).json();
    assert.deepEqual(Object.keys(one).sort(), ["data", "ok"]);
    assert.equal(one.data.name, "Brian Otieno");

    const missing = await get("/api/v2/artisans/nope");
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { ok: false, error: "Artisan not found." });
  });
});

test.describe("v2 needs a key, like everything else", () => {
  test("no key -> 401, wrong scope -> 403", async () => {
    assert.equal((await get("/api/v2/artisans", {})).status, 401);
    assert.equal((await get("/api/v2/artisans", { "X-API-Key": "web-key" })).status, 403);
    assert.equal((await get("/api/v2/artisans/a-100", {})).status, 401);
  });
});

test.describe("deprecation headers", () => {
  test("v1 and the old URLs announce the sunset", async () => {
    for (const path of ["/api/v1/artisans", "/api/artisans", "/api/v1/artisans/a-100", "/api/artisans/a-100"]) {
      const res = await get(path);
      assert.equal(res.headers.get("deprecation"), "true", path);
      assert.equal(res.headers.get("sunset"), new Date(V1_SUNSET).toUTCString(), path);
      assert.match(res.headers.get("link"), /rel="successor-version"/, path);
      assert.match(res.headers.get("link"), /\/api\/v2\/artisans/, path);
    }
  });

  test("v2, health and unknown paths do not carry them", async () => {
    for (const path of ["/api/v2/artisans", "/api/v2/artisans/a-100", "/api/health", "/api/nope"]) {
      const res = await get(path);
      assert.equal(res.headers.get("deprecation"), null, path);
      assert.equal(res.headers.get("sunset"), null, path);
    }
  });
});

test.describe("/api/stats shows the versions as separate rows", () => {
  test("v1, unversioned and v2 are counted apart", async () => {
    await get("/api/artisans");
    await get("/api/v1/artisans");
    await get("/api/v2/artisans");
    const stats = await (await get("/api/stats")).json();
    for (const label of ["GET /api/artisans/", "GET /api/v1/artisans/", "GET /api/v2/artisans"]) {
      assert.ok(stats.routes[label], `missing row: ${label}`);
    }
  });
});

test("fixture sanity: one artisan is unverified", () => {
  assert.equal(ARTISANS.filter((a) => !a.verified).length, 1);
});
