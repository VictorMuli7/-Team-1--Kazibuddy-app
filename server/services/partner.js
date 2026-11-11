/* The ONE place that knows the shape of the HospitalQ partner API.
   Each version says where its endpoints live (prefix) and how to read what
   comes back (parse). Everything else in hospitalQService.js and the routes
   just receives the result, so a partner version change is a change in
   this file plus one env var:  HOSPITALQ_VERSION=v1 | v2

   v1 is today's real behaviour (https://hospitalq-webapp.vercel.app/api/...),
   parsing is a pass-through, exactly what the service did before.

   v2 is NOT filled in yet: it needs HospitalQ's deprecation notice (their
   paths and response shape). Until then it fails loudly instead of guessing,
   so flipping the switch early shows up as a clear error and not as a vague
   failure three layers away. When the notice arrives, fill in `prefix` and
   `parse` below and add the real v2 sample bodies to test/partner.test.js. */

const versions = {
  v1: {
    prefix: "/api",
    parse: (body) => body,
  },
  v2: {
    prefix: "/api/v2", // TODO: confirm against HospitalQ's notice
    parse: () => {
      throw new Error("HospitalQ v2 is not configured yet: fill in services/partner.js from their notice");
    },
  },
};

function currentVersion(env = process.env) {
  const name = env.HOSPITALQ_VERSION || "v1";
  if (!versions[name]) {
    throw new Error(`Unknown HOSPITALQ_VERSION "${name}" (use ${Object.keys(versions).join(" or ")})`);
  }
  return versions[name];
}

module.exports = { versions, currentVersion };
