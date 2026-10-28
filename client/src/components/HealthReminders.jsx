
import { useCallback, useEffect, useState } from "react";
import { healthApi } from "../api/healthApi";
import "./HealthReminders.css";

export default function HealthReminders() {
  const [reminders, setReminders] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [reminderData, medicationData] = await Promise.all([
        healthApi.getReminders(),
        healthApi.getMedications(),
      ]);

      setReminders(reminderData);
      setMedications(medicationData.medications || []);
    } catch (err) {
      setError(err.message || "Could not load health reminders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function createDemoHistory() {
    const confirmed = window.confirm(
      "Create fictional demo health records for this EMPTY test patient account? Do not use this on a real patient account."
    );

    if (!confirmed) return;

    setSeeding(true);
    setError("");
    setNotice("");

    try {
      const result = await healthApi.seedDemo();
      setNotice(result.message || "Demo history created.");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not create demo history.");
    } finally {
      setSeeding(false);
    }
  }

  async function acknowledgeReminder(medicationId, time, status) {
    setError("");
    setNotice("");

    try {
      const scheduledAt = new Date();
      const [hours, minutes] = time.split(":").map(Number);

      scheduledAt.setHours(hours, minutes, 0, 0);

      await healthApi.acknowledgeMedication(
        medicationId,
        scheduledAt.toISOString(),
        status
      );

      setNotice(
        status === "acknowledged"
          ? "Reminder acknowledged. This does not verify medicine intake."
          : "Reminder marked as skipped."
      );
    } catch (err) {
      setError(err.message || "Could not update reminder.");
    }
  }

  if (loading) {
    return (
      <section className="hr-card">
        <p>Loading health reminders...</p>
      </section>
    );
  }

  return (
    <section className="hr-card">
      <div className="hr-header">
        <div>
          <h2>AI Health Tracking</h2>
          <p>Health history, follow-ups and approved medicine schedules.</p>
        </div>

        <button
          type="button"
          className="hr-button"
          onClick={createDemoHistory}
          disabled={seeding}
        >
          {seeding ? "Creating..." : "Add Demo History"}
        </button>
      </div>

      {error && <p className="hr-error" role="alert">{error}</p>}
      {notice && <p className="hr-notice" role="status">{notice}</p>}

      <div className="hr-section">
        <h3>Upcoming Follow-ups</h3>

        {reminders?.followups?.length ? (
          reminders.followups.map((item) => (
            <div className="hr-item" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>
                  Due:{" "}
                  {item.dueAt
                    ? new Date(item.dueAt).toLocaleString()
                    : "Date not set"}
                </p>
              </div>
              <span className="hr-tag">{item.status}</span>
            </div>
          ))
        ) : (
          <p className="hr-empty">No upcoming follow-ups found.</p>
        )}
      </div>

      <div className="hr-section">
        <h3>Doctor-Approved Care Plan Reviews</h3>

        {reminders?.carePlanReviews?.length ? (
          reminders.carePlanReviews.map((plan, index) => (
            <div className="hr-item" key={`${plan.title}-${index}`}>
              <div>
                <strong>{plan.title}</strong>
                <p>
                  Review date:{" "}
                  {plan.nextReviewAt
                    ? new Date(plan.nextReviewAt).toLocaleDateString()
                    : "Not scheduled"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="hr-empty">No approved care plan reviews scheduled.</p>
        )}
      </div>

      <div className="hr-section">
        <h3>Medicine Schedules</h3>

        {medications.filter(
          (med) =>
            med.approvedByDoctor &&
            med.status === "active"
        ).length ? (
          medications
            .filter(
              (med) =>
                med.approvedByDoctor &&
                med.status === "active"
            )
            .map((med) => (
              <div className="hr-item" key={med._id}>
                <div>
                  <strong>{med.medicineName}</strong>
                  <p>Prescribed dose: {med.prescribedDose}</p>
                  <p>
                    Schedule:{" "}
                    {med.times?.length
                      ? med.times.join(", ")
                      : "No reminder times configured"}
                  </p>
                  {med.instructions && <p>{med.instructions}</p>}

                  {med.times?.map((time) => (
                    <div className="hr-actions" key={time}>
                      <span>{time}</span>
                      <button
                        type="button"
                        onClick={() =>
                          acknowledgeReminder(med._id, time, "acknowledged")
                        }
                      >
                        Acknowledge
                      </button>
                      <button
                        type="button"
                        className="hr-secondary"
                        onClick={() =>
                          acknowledgeReminder(med._id, time, "skipped")
                        }
                      >
                        Skip
                      </button>
                    </div>
                  ))}
                </div>
                <span className="hr-tag">Doctor approved</span>
              </div>
            ))
        ) : (
          <p className="hr-empty">
            No active, doctor-approved medicine schedules.
          </p>
        )}
      </div>

      <button
        type="button"
        className="hr-secondary hr-refresh"
        onClick={loadData}
      >
        Refresh data
      </button>

      <p className="hr-disclaimer">
        Demo data is fictional. Reminders do not replace medical advice,
        and acknowledging a reminder does not confirm that medicine was taken.
      </p>
    </section>
  );
}
