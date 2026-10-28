
const API_BASE = "http://localhost:5000/api/health";

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
    throw new Error(data.message || "Health API request failed.");
  }

  return data;
}

export const healthApi = {
  // Patient health profile
  getProfile: () => request("/profile"),

  saveProfile: (profile) =>
    request("/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    }),

  // Health readings
  addReading: (reading) =>
    request("/readings", {
      method: "POST",
      body: JSON.stringify(reading),
    }),

  getReadings: () => request("/readings?limit=30"),

  // Existing AI health analysis
  analyze: () =>
    request("/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    }),

  // NEW: Agentic AI whole-case review
  caseReview: () =>
    request("/case-review", {
      method: "POST",
      body: JSON.stringify({}),
    }),

  // Follow-ups
  getFollowups: () => request("/followups"),

  completeFollowup: (id) =>
    request(`/followups/${encodeURIComponent(id)}/complete`, {
      method: "PATCH",
      body: JSON.stringify({}),
    }),

  // Health alerts
  getAlerts: () => request("/alerts"),

  reviewAlert: (id) =>
    request(`/alerts/${encodeURIComponent(id)}/reviewed`, {
      method: "PATCH",
      body: JSON.stringify({}),
    }),

  // Create fictional history on an empty test patient account only
  seedDemo: () =>
    request("/demo-seed", {
      method: "POST",
      body: JSON.stringify({}),
    }),

  // Medication schedules
  getMedications: () => request("/medications"),

  // Follow-up and medicine reminders
  getReminders: () => request("/reminders"),

  // Acknowledge or skip a doctor-approved medicine reminder
  acknowledgeMedication: (id, scheduledAt, status) =>
    request(`/medications/${encodeURIComponent(id)}/acknowledge`, {
      method: "POST",
      body: JSON.stringify({ scheduledAt, status }),
    }),
};
