
const API_BASE = "http://localhost:5000/api/doctor/health";

async function request(path, options = {}) {
  const token = sessionStorage.getItem("jr_token");

  if (!token) {
    throw new Error("Please login first.");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Doctor health API request failed.");
  }

  return data;
}

export const doctorHealthApi = {
  getPatients: () => request("/patients"),

  getPatientDetails: (patientId) =>
    request(`/patients/${encodeURIComponent(patientId)}`),

  analyzePatient: (patientId) =>
    request(`/patients/${encodeURIComponent(patientId)}/analyze`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
};
