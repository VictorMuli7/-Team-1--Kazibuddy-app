
const BASE_URL = "https://hospitalq-webapp.vercel.app";

let cachedToken = null;

async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
