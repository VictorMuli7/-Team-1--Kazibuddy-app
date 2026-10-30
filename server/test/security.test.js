const test = require("node:test");
const assert = require("node:assert/strict");
const { parseApiKeys, requireApiKey, requireScope, rateLimit } = require("../middleware/apiSecurity");

function response() {
  return {
    headers: {},
    statusCode: 200,
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("parses scoped keys and per-key rate limits without retaining plaintext keys", () => {
  const consumers = parseApiKeys({
    API_KEYS: "partner:partner:partner-test:7,website:web:web-test",
    PARTNER_API_KEYS: "legacy-partner",
  });

  assert.deepEqual(consumers.map(({ label, scope, limit }) => ({ label, scope, limit })), [
    { label: "partner", scope: "partner", limit: 7 },
    { label: "website", scope: "web", limit: undefined },
    { label: "partner-1", scope: "partner", limit: undefined },
  ]);
  assert.ok(consumers.every(({ digest }) => Buffer.isBuffer(digest)));
  assert.ok(consumers.every(({ digest }) => !digest.includes("partner-test")));
});

test("rejects missing and invalid keys with the same response", () => {
  const authenticate = requireApiKey(parseApiKeys({ API_KEYS: "client:partner:valid-key" }));

  for (const key of [undefined, "invalid-key"]) {
    const req = { get: () => key };
    const res = response();
    let called = false;
    authenticate(req, res, () => { called = true; });
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { ok: false, error: "Missing or invalid API key." });
    assert.equal(called, false);
  }
});

test("accepts a valid key and enforces the assigned scope", () => {
  const consumers = parseApiKeys({ API_KEYS: "client:partner:valid-key" });
  const req = { get: () => "valid-key" };
  const res = response();
  let called = false;

  requireApiKey(consumers)(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.equal(req.apiConsumer.scope, "partner");

  const scopeRes = response();
  requireScope("web")(req, scopeRes, () => { called = false; });
  assert.equal(scopeRes.statusCode, 403);
  assert.deepEqual(scopeRes.body, {
    ok: false,
    error: "This API key is not allowed to use this endpoint.",
  });
  assert.equal(called, true);
});

test("rate-limits each consumer and returns retry headers", () => {
  const limit = rateLimit({ windowMs: 60000, max: 1 });
  const req = { apiConsumer: { id: 1 } };
  const first = response();
  let called = false;
  limit(req, first, () => { called = true; });
  assert.equal(called, true);
  assert.equal(first.headers["X-RateLimit-Limit"], "1");
  assert.equal(first.headers["X-RateLimit-Remaining"], "0");

  const second = response();
  limit(req, second, () => { called = true; });
  assert.equal(second.statusCode, 429);
  assert.equal(second.headers["Retry-After"], second.body.retryAfter.toString());
  assert.equal(second.body.ok, false);
});

test("rate-limits public requests by client IP when no API consumer is present", () => {
  const limit = rateLimit({ windowMs: 60000, max: 1 });
  const req = { ip: "127.0.0.1" };
  const first = response();
  let called = false;
  limit(req, first, () => { called = true; });
  assert.equal(called, true);

  const second = response();
  limit(req, second, () => { called = true; });
  assert.equal(second.statusCode, 429);
  assert.equal(second.body.ok, false);
  assert.ok(Number(second.headers["Retry-After"]) >= 1);
});
