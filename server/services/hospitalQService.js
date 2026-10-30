const BASE_URL = "https://hospitalq-webapp.vercel.app";

// HospitalQ now requires an API key on its requests.
// Get the key (and the header name it expects) from your producer.
const API_KEY = process.env.HOSPITALQ_API_KEY;
const API_KEY_HEADER = process.env.HOSPITALQ_API_KEY_HEADER || "x-api-key";

function keyHeaders() {
  return API_KEY ? { [API_KEY_HEADER]: API_KEY } : {};
}

let cachedToken = null;

async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...keyHeaders() },
    body: JSON.stringify({
      email: process.env.HOSPITALQ_EMAIL,
      password: process.env.HOSPITALQ_PASSWORD
    })
  });

  const result = await response.json();

  if (!response.ok || !result.data?.token) {
    throw new Error("HospitalQ login failed");
  }

  cachedToken = result.data.token;
  return cachedToken;
}

async function request(path, options = {}, protectedRoute = false) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...keyHeaders(),
    ...options.headers
  };

  if (protectedRoute) {
    headers.Authorization = `Bearer ${await login()}`;
  }

  let response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });

  // Refresh the token if it has expired.
  if (response.status === 401 && protectedRoute) {
    cachedToken = null;
    headers.Authorization = `Bearer ${await login()}`;

    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers
    });
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`HospitalQ returned ${response.status}`);
  }

  return result;
}

module.exports = {
  departments: () => request("/api/departments"),

  queue: (department) =>
    request(`/api/queue/${encodeURIComponent(department)}`),

  waitStats: (department) =>
    request(`/api/queue/${encodeURIComponent(department)}/stats`),

  checkIn: (patientName, department) =>
    request("/api/queue", {
      method: "POST",
      body: JSON.stringify({ patientName, department })
    }, true),

  overview: () =>
    request("/api/analytics/overview", {}, true)
};


