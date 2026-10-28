
import { useCallback, useEffect, useState } from "react";
import { appointmentApi } from "../api/appointmentApi";

function formatDate(value) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DoctorAppointmentRequests() {
  const [appointments, setAppointments] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRequests = useCallback(async () => {
    const result = await appointmentApi.getDoctorRequests();
    setAppointments(result.appointments || []);
  }, []);

  useEffect(() => {
    loadRequests().catch((err) => setError(err.message));
  }, [loadRequests]);

  async function respond(id, decision) {
    setError("");
    setMessage("");

    try {
      setLoading(true);

      const result = await appointmentApi.respond(
        id,
        decision,
        notes[id] || ""
      );

      setMessage(result.message || "Request updated.");
      await loadRequests();
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
          <p className="appointment-eyebrow">DOCTOR WORKSPACE</p>
          <h1>Appointment Requests</h1>
          <p>Review patient requests and confirm or reject them.</p>
        </div>

        <button
          className="appointment-button secondary-button"
          onClick={() =>
            loadRequests().catch((err) => setError(err.message))
          }
          type="button"
        >
          Refresh
        </button>
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
        <h2>Pending requests ({appointments.length})</h2>

        {appointments.length === 0 ? (
          <p className="appointment-empty">
            No pending appointment requests.
          </p>
        ) : (
          <div className="appointment-list">
            {appointments.map((appointment) => {
              const patient = appointment.patientId;

              return (
                <article
                  key={appointment._id}
                  className="appointment-item"
                >
                  <div className="appointment-item-top">
                    <div>
                      <h3>{patient?.name || "Patient"}</h3>
                      <p className="appointment-muted">
                        {patient?.email || "Email not available"}
                      </p>
                    </div>

                    <span className="appointment-status status-requested">
                      Requested
                    </span>
                  </div>

                  <p>
                    <strong>Requested time:</strong>{" "}
                    {formatDate(appointment.appointmentAt)}
                  </p>

                  <p>
                    <strong>Department:</strong>{" "}
                    {appointment.department || "General Medicine"}
                  </p>

                  <p>
                    <strong>Reason:</strong> {appointment.reason}
                  </p>

                  {appointment.patientNotes && (
                    <p>
                      <strong>Patient notes:</strong>{" "}
                      {appointment.patientNotes}
                    </p>
                  )}

                  <label htmlFor={`notes-${appointment._id}`}>
                    Response note (optional)
                  </label>

                  <textarea
                    id={`notes-${appointment._id}`}
                    rows={2}
                    maxLength={2000}
                    value={notes[appointment._id] || ""}
                    onChange={(event) =>
                      setNotes((previous) => ({
                        ...previous,
                        [appointment._id]: event.target.value,
                      }))
                    }
                    placeholder="Add instructions or an explanation"
                  />

                  <div className="appointment-actions">
                    <button
                      type="button"
                      className="appointment-button"
                      disabled={loading}
                      onClick={() =>
                        respond(appointment._id, "confirmed")
                      }
                    >
                      Confirm
                    </button>

                    <button
                      type="button"
                      className="appointment-button cancel-button"
                      disabled={loading}
                      onClick={() =>
                        respond(appointment._id, "rejected")
                      }
                    >
                      Reject
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
