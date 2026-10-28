
import { useEffect, useState } from "react";
import { doctorHealthApi } from "../api/doctorHealthApi";
import "./DoctorHealthAnalysis.css";

export default function DoctorHealthAnalysis() {
  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  async function loadPatients() {
    setLoading(true);
    setError("");

    try {
      const result = await doctorHealthApi.getPatients();
      const list = result.patients || [];

      setPatients(list);

      if (list.length && !list.some((p) => p.patientId === selectedId)) {
        setSelectedId(list[0].patientId);
      }

      if (!list.length) {
        setSelectedId("");
        setDetails(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
    // Load initial list once when component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    let cancelled = false;

    async function loadDetails() {
      setDetails(null);
      setError("");

      try {
        const result =
          await doctorHealthApi.getPatientDetails(selectedId);

        if (!cancelled) setDetails(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function runAnalysis() {
    if (!selectedId) return;

    setAnalyzing(true);
    setError("");

    try {
      const result = await doctorHealthApi.analyzePatient(selectedId);

      setDetails((previous) =>
        previous
          ? {
              ...previous,
              analysis: result.analysis,
              generatedAt: result.generatedAt,
              basedOnReadings: result.basedOnReadings,
            }
          : previous
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return <section className="dha-card">Loading assigned patients...</section>;
  }

  return (
    <section className="dha">
      <header className="dha-header">
        <div>
          <h2>Patient Health & AI Analysis</h2>
          <p>Review assigned patients' history and health trends.</p>
        </div>

        <button type="button" onClick={loadPatients}>
          Refresh
        </button>
      </header>

      {error && <p className="dha-error" role="alert">{error}</p>}

      {!patients.length ? (
        <div className="dha-card">
          <h3>No assigned patients</h3>
          <p>
            No active doctor-patient assignments were found for your account.
            An authorized admin or reception workflow must assign patients first.
          </p>
        </div>
      ) : (
        <>
          <label className="dha-label" htmlFor="dha-patient">
            Select patient
          </label>

          <select
            id="dha-patient"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {patients.map((patient) => (
              <option key={patient.patientId} value={patient.patientId}>
                {patient.profile?.fullName ||
                  patient.profile?.name ||
                  `Patient ${patient.patientId}`}
              </option>
            ))}
          </select>

          {!details ? (
            <div className="dha-card">Loading patient details...</div>
          ) : (
            <>
              <div className="dha-grid">
                <article className="dha-card">
                  <span>Patient ID</span>
                  <strong>{details.patientId}</strong>
                </article>

                <article className="dha-card">
                  <span>Historical readings</span>
                  <strong>{details.readings?.length || 0}</strong>
                </article>

                <article className="dha-card">
                  <span>Open alerts</span>
                  <strong>
                    {details.alerts?.filter((a) => a.status === "open").length || 0}
                  </strong>
                </article>

                <article className="dha-card">
                  <span>Follow-ups</span>
                  <strong>{details.followups?.length || 0}</strong>
                </article>
              </div>

              <div className="dha-card">
                <h3>Patient Profile</h3>
                {details.profile ? (
                  <>
                    <p>
                      Conditions:{" "}
                      {details.profile.conditions?.join(", ") || "Not recorded"}
                    </p>
                    <p>
                      Allergies:{" "}
                      {details.profile.allergies?.join(", ") || "Not recorded"}
                    </p>
                    <p>
                      Medicines in profile:{" "}
                      {details.profile.medicines?.join(", ") || "Not recorded"}
                    </p>
                    <p>
                      Weight:{" "}
                      {details.profile.weightKg != null
                        ? `${details.profile.weightKg} kg`
                        : "Not recorded"}
                    </p>
                  </>
                ) : (
                  <p>No health profile recorded.</p>
                )}
              </div>

              <div className="dha-card">
                <h3>Medical History</h3>

                {details.readings?.length ? (
                  <div className="dha-table-wrap">
                    <table className="dha-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>BP</th>
                          <th>Heart rate</th>
                          <th>Temperature</th>
                          <th>Symptoms</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.readings.map((reading) => (
                          <tr key={reading._id}>
                            <td>
                              {reading.recordedAt
                                ? new Date(reading.recordedAt).toLocaleDateString()
                                : "Unknown"}
                            </td>
                            <td>
                              {reading.systolicBP != null &&
                              reading.diastolicBP != null
                                ? `${reading.systolicBP}/${reading.diastolicBP}`
                                : "—"}
                            </td>
                            <td>
                              {reading.heartRate != null
                                ? `${reading.heartRate} bpm`
                                : "—"}
                            </td>
                            <td>
                              {reading.temperatureC != null
                                ? `${reading.temperatureC} °C`
                                : "—"}
                            </td>
                            <td>{reading.symptoms?.join(", ") || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No readings have been recorded.</p>
                )}
              </div>

              <div className="dha-card">
                <div className="dha-analysis-header">
                  <h3>AI Health Analysis</h3>
                  <button
                    type="button"
                    onClick={runAnalysis}
                    disabled={analyzing}
                  >
                    {analyzing ? "Analyzing..." : "Run AI Analysis"}
                  </button>
                </div>

                {details.analysisNotice && (
                  <p>{details.analysisNotice}</p>
                )}

                {details.analysis ? (
                  <pre className="dha-analysis">
                    {typeof details.analysis === "string"
                      ? details.analysis
                      : JSON.stringify(details.analysis, null, 2)}
                  </pre>
                ) : (
                  <p>
                    No analysis is available yet. Check patient consent and
                    run the analysis when permitted.
                  </p>
                )}

                {details.generatedAt && (
                  <p className="dha-muted">
                    Generated: {new Date(details.generatedAt).toLocaleString()}
                  </p>
                )}

                <p className="dha-disclaimer">
                  AI output is decision support, not a diagnosis or prescription.
                  Review the original readings and clinical context before acting.
                </p>
              </div>

              <div className="dha-card">
                <h3>Health Alerts</h3>
                {details.alerts?.length ? (
                  details.alerts.map((alert) => (
                    <div className="dha-item" key={alert._id}>
                      <strong>{alert.title}</strong>
                      <p>{alert.message}</p>
                      <span>{alert.severity} · {alert.status}</span>
                    </div>
                  ))
                ) : (
                  <p>No alerts recorded.</p>
                )}
              </div>

              <div className="dha-card">
                <h3>Follow-ups</h3>
                {details.followups?.length ? (
                  details.followups.map((item) => (
                    <div className="dha-item" key={item._id}>
                      <strong>{item.title}</strong>
                      <p>
                        {item.dueAt
                          ? new Date(item.dueAt).toLocaleString()
                          : "No due date"}
                      </p>
                      <span>{item.status}</span>
                    </div>
                  ))
                ) : (
                  <p>No follow-ups recorded.</p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
