
const HOSPITALQ_BASE_URL =
  "https://hospitalq-webapp.vercel.app";

let cachedToken = null;

async function request(path, options = {}) {
  const response = await fetch(`${HOSPITALQ_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      result.message || `HospitalQ returned HTTP ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  return result;
}

async function login() {
  const email = process.env.HOSPITALQ_EMAIL;
  const password = process.env.HOSPITALQ_PASSWORD;

  if (!email || !password) {
    throw new Error("HospitalQ credentials are not configured");
  }

  const result = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!result.data?.token) {
    throw new Error("HospitalQ login did not return data.token");
  }

  cachedToken = result.data.token;
  return cachedToken;
}

async function getToken() {
  return cachedToken || login();
}

async function authorizedRequest(path, options = {}) {
  let token = await getToken();

  try {
    return await request(path, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    if (error.status !== 401) throw error;

    // Obtain a fresh token and retry once.
    cachedToken = null;
    token = await login();

    return request(path, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

module.exports = {
  getDepartments: () => request("/api/departments"),

  getQueue: (department) =>
    request(`/api/queue/${encodeURIComponent(department)}`),

  getWaitTime: (department) =>
    request(`/api/queue/${encodeURIComponent(department)}/stats`),

  checkIn: (patientName, department) =>
    authorizedRequest("/api/queue", {
      method: "POST",
      body: JSON.stringify({ patientName, department }),
    }),

  getOverview: () =>
    authorizedRequest("/api/analytics/overview"),
};
