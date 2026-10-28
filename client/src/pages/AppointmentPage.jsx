
import { useCallback, useEffect, useState } from "react";
import { appointmentApi } from "../api/appointmentApi";

function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusClass(status) {
  return `appointment-status status-${status || "requested"}`;
}

export default function AppointmentPage() {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);

  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(getLocalDate());
  const [slot, setSlot] = useState("");
  const [reason, setReason] = useState("");
  const [patientNotes, setPatientNotes] = useState("");
  const [relatedCareTask, setRelatedCareTask] = useState("");

  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadAppointments = useCallback(async () => {
    const result = await appointmentApi.getMine();
    setAppointments(result.appointments || []);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        setLoading(true);
        setError("");

        const [doctorResult, appointmentResult] = await Promise.all([
          appointmentApi.getDoctors(),
          appointmentApi.getMine(),
        ]);

        if (!active) return;

        setDoctors(doctorResult.doctors || []);
        setAppointments(appointmentResult.appointments || []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSlots() {
      setSlots([]);
      setSlot("");

      if (!doctorId || !date) return;

      try {
        setSlotsLoading(true);
        setError("");

        const result = await appointmentApi.getAvailability(
          doctorId,
          date
        );

        if (active) setSlots(result.slots || []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setSlotsLoading(false);
      }
    }

    loadSlots();

    return () => {
      active = false;
    };
  }, [doctorId, date]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!doctorId || !slot || !reason.trim()) {
      setError("Please select a doctor, time slot and appointment reason.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        doctorId,
        appointmentAt: slot,
        reason: reason.trim(),
        patientNotes: patientNotes.trim(),
      };

      if (relatedCareTask.trim()) {
        payload.relatedCareTask = relatedCareTask.trim();
      }

      const result = await appointmentApi.create(payload);

      setMessage(
        result.message || "Appointment request sent to the doctor."
      );

      setSlot("");
      setReason("");
      setPatientNotes("");
      setRelatedCareTask("");

      await Promise.all([
        loadAppointments(),
        (async () => {
          const result = await appointmentApi.getAvailability(
            doctorId,
            date
          );
          setSlots(result.slots || []);
        })(),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      setLoading(true);
      const result = await appointmentApi.cancel(id);
      setMessage(result.message || "Appointment cancelled.");
      await loadAppointments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="appointment-page">
      <header className="appointment-header">
        <div>
          <p className="appointment-eyebrow">JEEVAN RAKSHAK AI</p>
          <h1>Doctor Appointments</h1>
          <p>
            Request an appointment and track the doctor's response.
          </p>
        </div>
      </header>

      {message && (
        <div className="appointment-message success-message" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="appointment-message error-message" role="alert">
          {error}
        </div>
      )}

      <section className="appointment-card">
        <h2>Book an appointment</h2>
        <p className="appointment-muted">
          Your request remains pending until the doctor confirms it.
        </p>

        <form onSubmit={handleSubmit} className="appointment-form">
          <label htmlFor="doctor">Select doctor</label>
          <select
            id="doctor"
            value={doctorId}
            onChange={(event) => setDoctorId(event.target.value)}
            required
          >
            <option value="">Choose a doctor</option>
            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>
                {doctor.name}
                {doctor.department ? ` — ${doctor.department}` : ""}
              </option>
            ))}
          </select>

          {doctors.length === 0 && !loading && (
            <p className="appointment-muted">
              No registered doctors found. Ask a doctor to register first.
            </p>
          )}

          <label htmlFor="appointment-date">Appointment date</label>
          <input
            id="appointment-date"
            type="date"
            min={getLocalDate()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />

          <label htmlFor="appointment-slot">Available time</label>
          <select
            id="appointment-slot"
            value={slot}
            onChange={(event) => setSlot(event.target.value)}
            disabled={!doctorId || slotsLoading || slots.length === 0}
            required
          >
            <option value="">
              {slotsLoading
                ? "Loading available slots..."
                : slots.length
                  ? "Choose a time"
                  : "No slots available"}
            </option>

            {slots.map((item) => (
              <option key={item.startAt} value={item.startAt}>
                {item.label}
              </option>
            ))}
          </select>

          <label htmlFor="appointment-reason">Reason for appointment</label>
          <textarea
            id="appointment-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Briefly describe why you want to consult the doctor"
            required
          />

          <label htmlFor="patient-notes">Additional notes (optional)</label>
          <textarea
            id="patient-notes"
            value={patientNotes}
            onChange={(event) => setPatientNotes(event.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Relevant information for the doctor"
          />

          <label htmlFor="care-task">
            Existing Care Task ID (optional)
          </label>
          <input
            id="care-task"
            value={relatedCareTask}
            onChange={(event) => setRelatedCareTask(event.target.value)}
            placeholder="Paste a CareTask ID to link it"
          />
          <p className="appointment-muted">
            Leave blank if you are booking without an existing care task.
          </p>

          <button
            type="submit"
            disabled={loading || slotsLoading || !slot}
            className="appointment-button"
          >
            {loading ? "Please wait..." : "Request appointment"}
          </button>
        </form>
      </section>

      <section className="appointment-card">
        <div className="appointment-section-heading">
          <div>
            <h2>My appointments</h2>
            <p className="appointment-muted">
              Your requests, confirmed bookings and previous appointments.
            </p>
          </div>

          <button
            type="button"
            className="appointment-button secondary-button"
            onClick={() => {
              loadAppointments().catch((err) => setError(err.message));
            }}
          >
            Refresh
          </button>
        </div>

        {appointments.length === 0 ? (
          <p className="appointment-empty">
            No appointments yet. Submit a request to get started.
          </p>
        ) : (
          <div className="appointment-list">
            {appointments.map((appointment) => {
              const doctor =
                appointment.doctorId &&
                typeof appointment.doctorId === "object"
                  ? appointment.doctorId
                  : null;

              const status = appointment.status || "requested";

              return (
                <article
                  className="appointment-item"
                  key={appointment._id}
                >
                  <div className="appointment-item-top">
                    <div>
                      <h3>{doctor?.name || "Doctor"}</h3>
                      <p className="appointment-muted">
                        {doctor?.department ||
                          appointment.department ||
                          "General Medicine"}
                      </p>
                    </div>

                    <span className={statusClass(status)}>
                      {status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <p>
                    <strong>Date:</strong>{" "}
                    {formatDate(appointment.appointmentAt)}
                  </p>

                  <p>
                    <strong>Reason:</strong> {appointment.reason}
                  </p>

                  {appointment.doctorNotes && (
                    <p>
                      <strong>Doctor's note:</strong>{" "}
                      {appointment.doctorNotes}
                    </p>
                  )}

                  {["requested", "confirmed"].includes(status) && (
                    <button
                      type="button"
                      className="appointment-button cancel-button"
                      disabled={loading}
                      onClick={() => handleCancel(appointment._id)}
                    >
                      Cancel appointment
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
