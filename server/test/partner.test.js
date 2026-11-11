const test = require("node:test");
const assert = require("node:assert/strict");
const { versions, currentVersion } = require("../services/partner");

// Real HospitalQ v1 body (from INTEGRATION_LOG.MD, Endpoint 1).
const v1Body = { success: true, data: [{ _id: "1", name: "Dental", slug: "dental", isActive: true }] };

test("v1 parses to exactly what the service returned before the change", () => {
  assert.deepEqual(versions.v1.parse(v1Body), v1Body);
  assert.equal(versions.v1.prefix, "/api");
});

test("v2 is not configured yet and fails loudly, not quietly", () => {
  assert.throws(() => versions.v2.parse(v1Body), /HospitalQ v2 is not configured yet/);
});

test("HOSPITALQ_VERSION picks the version, defaults to v1, rejects typos", () => {
  assert.equal(currentVersion({}), versions.v1);
  assert.equal(currentVersion({ HOSPITALQ_VERSION: "v2" }), versions.v2);
  assert.throws(() => currentVersion({ HOSPITALQ_VERSION: "v3" }), /Unknown HOSPITALQ_VERSION/);
});

test("the service calls the v1 URLs it always did", async () => {
  const calls = [];
  const realFetch = global.fetch;
  global.fetch = async (url) => {
    calls.push(String(url));
    return { ok: true, status: 200, json: async () => v1Body };
  };
  try {
    delete process.env.HOSPITALQ_VERSION;
    const svc = require("../services/hospitalQService");
    assert.deepEqual(await svc.departments(), v1Body);
    await svc.queue("general-opd");
    await svc.waitStats("general-opd");
    assert.deepEqual(calls, [
      "https://hospitalq-webapp.vercel.app/api/departments",
      "https://hospitalq-webapp.vercel.app/api/queue/general-opd",
      "https://hospitalq-webapp.vercel.app/api/queue/general-opd/stats",
    ]);
  } finally {
    global.fetch = realFetch;
  }
});
