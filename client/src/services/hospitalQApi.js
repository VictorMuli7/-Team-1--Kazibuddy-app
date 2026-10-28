
import { API_URL, apiFetch } from "../lib/api";

async function apiRequest(path, options = {}) {
  const response = await apiFetch(
    `${API_URL}/partners/hospitalq${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "HospitalQ request failed");
  }

  return data;
}

export const getDepartments = () =>
  apiRequest("/departments");

export const getQueue = (department = "general-opd") =>
  apiRequest(`/queue/${encodeURIComponent(department)}`);

export const getWaitStats = (department = "general-opd") =>
  apiRequest(`/queue/${encodeURIComponent(department)}/stats`);

export const checkInPatient = (patientName, department) =>
  apiRequest("/queue", {
    method: "POST",
    body: JSON.stringify({ patientName, department })
  });

export const getHospitalOverview = () =>
  apiRequest("/analytics/overview");
