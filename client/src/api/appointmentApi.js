
const API_BASE = "http://localhost:5000/api/appointments";

async function request(path, options = {}) {
  const token = sessionStorage.getItem("jr_token");

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Appointment request failed.");
  }

  return data;
}

export const appointmentApi = {
  getDoctors: (department = "") =>
    request(
      `/doctors${
        department
          ? `?department=${encodeURIComponent(department)}`
          : ""
      }`
    ),

  getAvailability: (doctorId, date) =>
    request(
      `/availability?doctorId=${encodeURIComponent(
        doctorId
      )}&date=${encodeURIComponent(date)}`
    ),

  create: (payload) =>
    request("/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMine: () => request("/mine"),

  cancel: (id) =>
    request(`/${id}/cancel`, {
      method: "PATCH",
    }),

  getDoctorRequests: () => request("/doctor/requests"),

  respond: (id, decision, doctorNotes = "") =>
    request(`/${id}/respond`, {
      method: "PATCH",
      body: JSON.stringify({ decision, doctorNotes }),
    }),
};
