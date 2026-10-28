
import { useCallback, useEffect, useState } from "react";
import { healthApi } from "../api/healthApi";
import "./PatientHealthMonitor.css";

const initialProfile = {
  dateOfBirth: "",
  sex: "prefer_not_to_say",
  heightCm: "",
  weightKg: "",
  bloodGroup: "unknown",
  conditions: [],
  allergies: [],
  familyHistory: [],
  medicines: [],
  profileNotes: "",
  consentForHealthAnalysis: false,
};

const initialReading = {
  systolicBP: "",
  diastolicBP: "",
  heartRate: "",
  temperatureC: "",
  weightKg: "",
  glucoseMgDl: "",
  symptoms: "",
  symptomSeverity: "none",
  notes: "",
};

function numberOrUndefined(value) {
  if (value === "" || value == null) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function formatDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : date.toLocaleString();
}

function renderText(value) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (value == null) return "";
  return JSON.stringify(value, null, 2);
}

export default function PatientHealthMonitor() {
  const [profile, setProfile] = useState(initialProfile);
  const [reading, setReading] = useState(initialReading);
  const [readings, setReadings] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [caseReview, setCaseReview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        profileResult,
        readingsResult,
        followupsResult,
        alertsResult,
      ] = await Promise.all([
        healthApi.getProfile(),
        healthApi.getReadings(),
        healthApi.getFollowups(),
        healthApi.getAlerts(),
      ]);

      if (profileResult.profile) {
        const savedProfile = profileResult.profile;

        setProfile({
          ...initialProfile,
          ...savedProfile,
          dateOfBirth: savedProfile.dateOfBirth
            ? new Date(savedProfile.dateOfBirth)
                .toISOString()
                .slice(0, 10)
            : "",
          heightCm: savedProfile.heightCm ?? "",
          weightKg: savedProfile.weightKg ?? "",
          conditions: savedProfile.conditions || [],
          allergies: savedProfile.allergies || [],
          familyHistory: savedProfile.familyHistory || [],
          medicines: savedProfile.medicines || [],
        });
      }

      setReadings(readingsResult.readings || []);
      setFollowups(followupsResult.followups || []);
      setAlerts(alertsResult.alerts || []);
    } catch (err) {
      setError(err.message || "Could not load your health dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function saveProfile(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        ...profile,
        heightCm: numberOrUndefined(profile.heightCm),
        weightKg: numberOrUndefined(profile.weightKg),
        conditions: Array.isArray(profile.conditions)
          ? profile.conditions
          : [],
        allergies: Array.isArray(profile.allergies)
          ? profile.allergies
          : [],
        familyHistory: Array.isArray(profile.familyHistory)
          ? profile.familyHistory
          : [],
        medicines: Array.isArray(profile.medicines)
          ? profile.medicines
          : [],
      };

      await healthApi.saveProfile(payload);
      setNotice("Health profile saved successfully.");
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  }

  // Save a reading, refresh the dashboard, and automatically run
  // the whole-case review only when health-analysis consent is enabled.
  async function submitReading(event) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setNotice("");
    setReviewError("");
    setAnalysis(null);
    setCaseReview(null);

    try {
      const payload = {
        ...reading,
        symptoms: reading.symptoms
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      for (const key of [
        "systolicBP",
        "diastolicBP",
        "heartRate",
        "temperatureC",
        "weightKg",
        "glucoseMgDl",
      ]) {
        payload[key] = numberOrUndefined(reading[key]);
      }

      // Save the reading first.
      await healthApi.addReading(payload);

      setReading(initialReading);
      setNotice("Daily health check-in saved.");

      // Refresh recent readings, profile, follow-ups and alerts.
      await loadDashboard();

      // Check the latest saved consent from the backend.
      const profileResult = await healthApi.getProfile();
      const consentEnabled =
        profileResult?.profile?.consentForHealthAnalysis === true;

      if (consentEnabled) {
        setReviewBusy(true);

        try {
          const result = await healthApi.caseReview();

          if (!result?.review) {
            throw new Error("The server returned no case review.");
          }

          setCaseReview(result.review);
          setNotice(
            "Health check-in saved and AI case review updated."
          );
        } catch (reviewErr) {
          // The reading is already saved, even if the AI review fails.
          setReviewError(
            `Reading saved, but case review failed: ${
              reviewErr.message || "Unknown error"
            }`
          );
        } finally {
          setReviewBusy(false);
        }
      }
    } catch (err) {
      setError(err.message || "Could not save today's readings.");
    } finally {
      setBusy(false);
    }
  }

  async function runAnalysis() {
    setBusy(true);
    setError("");
    setNotice("");
    setAnalysis(null);

    try {
      const result = await healthApi.analyze();

      if (result.analysis == null) {
        throw new Error("The AI service returned no analysis.");
      }

      setAnalysis(result.analysis);
      setNotice(
        `Analysis generated using ${
          result.basedOnReadings ?? "available"
        } readings.`
      );
    } catch (err) {
      setError(err.message || "AI analysis could not be generated.");
    } finally {
      setBusy(false);
    }
  }

  async function runCaseReview() {
    setReviewBusy(true);
    setReviewError("");
    setNotice("");

    try {
      const result = await healthApi.caseReview();

      if (!result?.review) {
        throw new Error("No case review was returned by the server.");
      }

      setCaseReview(result.review);
      setNotice("Whole patient case review completed.");
    } catch (err) {
      setReviewError(
        err.message || "Could not review the patient case."
      );
    } finally {
      setReviewBusy(false);
    }
  }

  async function completeFollowup(id) {
    setError("");
    setNotice("");

    try {
      await healthApi.completeFollowup(id);
      setNotice("Follow-up marked complete.");
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Could not update follow-up.");
    }
  }

  async function reviewAlert(id) {
    setError("");
    setNotice("");

    try {
      await healthApi.reviewAlert(id);
      setNotice("Alert acknowledged.");
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Could not update alert.");
    }
  }

  const updateProfile = (key, value) => {
    setProfile((previous) => ({ ...previous, [key]: value }));
  };

  const updateReading = (key, value) => {
    setReading((previous) => ({ ...previous, [key]: value }));
  };

  if (loading) {
    return (
      <main className="health-monitor">
        <p>Loading health dashboard...</p>
      </main>
    );
  }

  const analysisIsObject =
    analysis !== null && typeof analysis === "object";

  return (
    <main className="health-monitor">
      <header className="health-monitor__header">
        <div>
          <p className="health-monitor__eyebrow">
            JEEVAN RAKSHAK AI
          </p>
          <h1>My Health Monitor</h1>
          <p>
            Track your health, review trends and stay on top of follow-ups.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          disabled={busy || reviewBusy}
        >
          Refresh
        </button>
      </header>

      {error && (
        <p
          className="health-message health-message--error"
          role="alert"
        >
          {error}
        </p>
      )}

      {notice && (
        <p className="health-message" role="status">
          {notice}
        </p>
      )}

      <section className="health-card">
        <h2>Health Profile</h2>

        <form onSubmit={saveProfile} className="health-form">
          <label>
            Date of birth
            <input
              type="date"
              value={profile.dateOfBirth}
              onChange={(event) =>
                updateProfile("dateOfBirth", event.target.value)
              }
            />
          </label>

          <label>
            Sex (optional)
            <select
              value={profile.sex}
              onChange={(event) =>
                updateProfile("sex", event.target.value)
              }
            >
              <option value="prefer_not_to_say">
                Prefer not to say
              </option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="intersex">Intersex</option>
            </select>
          </label>

          <label>
            Height (cm)
            <input
              type="number"
              min="20"
              max="300"
              value={profile.heightCm}
              onChange={(event) =>
                updateProfile("heightCm", event.target.value)
              }
            />
          </label>

          <label>
            Weight (kg)
            <input
              type="number"
              min="1"
              max="500"
              step="0.1"
              value={profile.weightKg}
              onChange={(event) =>
                updateProfile("weightKg", event.target.value)
              }
            />
          </label>

          <label>
            Blood group
            <select
              value={profile.bloodGroup}
              onChange={(event) =>
                updateProfile("bloodGroup", event.target.value)
              }
            >
              {[
                "unknown",
                "A+",
                "A-",
                "B+",
                "B-",
                "AB+",
                "AB-",
                "O+",
                "O-",
              ].map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>

          <label className="health-form__wide">
            Existing conditions (comma separated)
            <input
              value={profile.conditions.join(", ")}
              onChange={(event) =>
                updateProfile(
                  "conditions",
                  event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
              placeholder="e.g. diabetes, hypertension"
            />
          </label>

          <label className="health-form__wide">
            Allergies (comma separated)
            <input
              value={profile.allergies.join(", ")}
              onChange={(event) =>
                updateProfile(
                  "allergies",
                  event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
              placeholder="e.g. penicillin"
            />
          </label>

          <label className="health-form__wide">
            Family history (comma separated)
            <input
              value={profile.familyHistory.join(", ")}
              onChange={(event) =>
                updateProfile(
                  "familyHistory",
                  event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
              placeholder="Optional family medical history"
            />
          </label>

          <label className="health-form__wide">
            Medical notes
            <textarea
              maxLength={2000}
              value={profile.profileNotes}
              onChange={(event) =>
                updateProfile("profileNotes", event.target.value)
              }
            />
          </label>

          <label className="health-consent health-form__wide">
            <input
              type="checkbox"
              checked={profile.consentForHealthAnalysis}
              onChange={(event) =>
                updateProfile(
                  "consentForHealthAnalysis",
                  event.target.checked
                )
              }
            />
            I consent to AI-assisted analysis of the health information
            I provide. I understand that it does not replace a clinician.
          </label>

          <button disabled={busy} type="submit">
            {busy ? "Saving..." : "Save Health Profile"}
          </button>
        </form>
      </section>

      <section className="health-card">
        <h2>Daily Health Check-in</h2>

        <form onSubmit={submitReading} className="health-form">
          {[
            ["systolicBP", "Systolic BP (mmHg)"],
            ["diastolicBP", "Diastolic BP (mmHg)"],
            ["heartRate", "Heart rate (bpm)"],
            ["temperatureC", "Temperature (°C)"],
            ["weightKg", "Weight (kg)"],
            ["glucoseMgDl", "Glucose (mg/dL)"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                step="any"
                value={reading[key]}
                onChange={(event) =>
                  updateReading(key, event.target.value)
                }
              />
            </label>
          ))}

          <label>
            Symptom severity
            <select
              value={reading.symptomSeverity}
              onChange={(event) =>
                updateReading("symptomSeverity", event.target.value)
              }
            >
              <option value="none">None</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </label>

          <label className="health-form__wide">
            Symptoms (comma separated)
            <input
              value={reading.symptoms}
              onChange={(event) =>
                updateReading("symptoms", event.target.value)
              }
              placeholder="e.g. headache, fatigue"
            />
          </label>

          <label className="health-form__wide">
            Notes
            <textarea
              maxLength={1000}
              value={reading.notes}
              onChange={(event) =>
                updateReading("notes", event.target.value)
              }
            />
          </label>

          <button disabled={busy} type="submit">
            {busy ? "Saving..." : "Save Today's Readings"}
          </button>
        </form>
      </section>

      <section className="health-card">
        <div className="health-section-heading">
          <div>
            <h2>AI Health Insights</h2>
            <p>
              An analysis of recorded readings and approved care plans.
            </p>
          </div>

          <button
            type="button"
            onClick={runAnalysis}
            disabled={busy || !profile.consentForHealthAnalysis}
          >
            {busy ? "Please wait..." : "Analyze My Health"}
          </button>
        </div>

        {!profile.consentForHealthAnalysis && (
          <p>
            Save your profile with consent enabled to use AI analysis.
          </p>
        )}

        {analysis && (
          <div className="health-analysis">
            {typeof analysis === "string" ? (
              <>
                <h3>AI Health Summary</h3>
                <p style={{ whiteSpace: "pre-wrap" }}>{analysis}</p>
              </>
            ) : analysisIsObject ? (
              <>
                <h3>Summary</h3>
                <p>
                  {renderText(analysis.summary) ||
                    "No summary was included in the AI response."}
                </p>

                <h3>Observations</h3>
                {analysis.observations?.length ? (
                  <ul>
                    {analysis.observations.map((item, index) => (
                      <li key={index}>{renderText(item)}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No additional observations were returned.</p>
                )}

                <h3>Suggested Next Steps</h3>
                {analysis.nextSteps?.length ? (
                  <ul>
                    {analysis.nextSteps.map((item, index) => (
                      <li key={index}>{renderText(item)}</li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    Follow the existing clinician-approved care plan
                    and ask your clinician about any concerns.
                  </p>
                )}

                {analysis.flags?.length > 0 && (
                  <>
                    <h3>Items for Review</h3>
                    {analysis.flags.map((flag, index) => (
                      <article className="health-alert" key={index}>
                        <strong>
                          {typeof flag === "string"
                            ? flag
                            : renderText(flag.title) || "Review flag"}
                        </strong>
                        {typeof flag === "object" && flag.message && (
                          <p>{renderText(flag.message)}</p>
                        )}
                      </article>
                    ))}
                  </>
                )}
              </>
            ) : (
              <p>No readable analysis was returned.</p>
            )}

            <p className="health-disclaimer">
              AI-generated information is not a diagnosis or prescription.
              Check findings with a qualified clinician. Do not change
              medication or treatment based only on this analysis.
            </p>
          </div>
        )}
      </section>

      <section className="health-card">
        <div className="health-section-heading">
          <div>
            <h2>Agentic AI — Whole Case Review</h2>
            <p>
              Review your recorded readings and available doctor-approved
              care plans together.
            </p>
          </div>

          <button
            type="button"
            onClick={runCaseReview}
            disabled={
              reviewBusy || busy || !profile.consentForHealthAnalysis
            }
          >
            {reviewBusy ? "Reviewing case..." : "Run Whole Case Review"}
          </button>
        </div>

        {!profile.consentForHealthAnalysis && (
          <p>
            Enable and save health-analysis consent in your profile first.
          </p>
        )}

        {reviewError && (
          <p
            className="health-message health-message--error"
            role="alert"
          >
            {reviewError}
          </p>
        )}

        {caseReview && (
          <div className="health-analysis">
            <h3>Case Summary</h3>
            <p>
              {renderText(caseReview.analysis?.summary) ||
                "No summary returned."}
            </p>

            <p>
              <strong>Readings reviewed:</strong>{" "}
              {caseReview.caseOverview?.recordedReadings ?? 0}
            </p>

            <h3>Observations</h3>
            {caseReview.analysis?.observations?.length ? (
              <ul>
                {caseReview.analysis.observations.map((item, index) => (
                  <li key={index}>{renderText(item)}</li>
                ))}
              </ul>
            ) : (
              <p>No additional observations returned.</p>
            )}

            <h3>Suggested Next Steps</h3>
            {caseReview.analysis?.nextSteps?.length ? (
              <ul>
                {caseReview.analysis.nextSteps.map((item, index) => (
                  <li key={index}>{renderText(item)}</li>
                ))}
              </ul>
            ) : (
              <p>No additional next steps returned.</p>
            )}

            <h3>Agent Actions</h3>
            {caseReview.actions?.length ? (
              caseReview.actions.map((action, index) => (
                <article
                  className="health-list-item"
                  key={`${action.type || "action"}-${index}`}
                >
                  <div>
                    <strong>
                      {action.title || "Recommended action"}
                    </strong>
                    <p>{action.message || ""}</p>
                    <small>
                      Priority: {action.priority || "routine"}
                    </small>
                  </div>
                </article>
              ))
            ) : (
              <p>No additional actions returned.</p>
            )}

            {caseReview.basicFlags?.length > 0 && (
              <>
                <h3>Health Flags for Review</h3>
                <ul>
                  {caseReview.basicFlags.map((flag, index) => (
                    <li key={index}>{renderText(flag)}</li>
                  ))}
                </ul>
              </>
            )}

            <p className="health-disclaimer">
              {caseReview.disclaimer ||
                "AI output is decision support, not a diagnosis or prescription. Confirm treatment decisions with a qualified clinician."}
            </p>
          </div>
        )}
      </section>

      <section className="health-card">
        <h2>Recent Readings</h2>

        {readings.length === 0 ? (
          <p>No readings recorded yet.</p>
        ) : (
          <div className="health-table-wrap">
            <table className="health-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>BP</th>
                  <th>Heart Rate</th>
                  <th>Temperature</th>
                  <th>Glucose</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((item) => (
                  <tr key={item._id}>
                    <td>{formatDate(item.recordedAt)}</td>
                    <td>
                      {item.systolicBP ?? "—"} /{" "}
                      {item.diastolicBP ?? "—"}
                    </td>
                    <td>{item.heartRate ?? "—"}</td>
                    <td>{item.temperatureC ?? "—"}</td>
                    <td>{item.glucoseMgDl ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="health-card">
        <h2>Follow-ups</h2>

        {followups.length === 0 ? (
          <p>No follow-ups have been assigned yet.</p>
        ) : (
          followups.map((item) => (
            <article className="health-list-item" key={item._id}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <small>Due: {formatDate(item.dueAt)}</small>
                <p>Status: {item.status}</p>
              </div>

              {item.status === "pending" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => completeFollowup(item._id)}
                >
                  Mark Complete
                </button>
              )}
            </article>
          ))
        )}
      </section>

      <section className="health-card">
        <h2>Health Alerts</h2>

        {alerts.length === 0 ? (
          <p>No alerts recorded.</p>
        ) : (
          alerts.map((item) => (
            <article className="health-list-item" key={item._id}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small>
                  Severity: {item.severity} · Status: {item.status}
                </small>
              </div>

              {item.status === "open" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => reviewAlert(item._id)}
                >
                  Acknowledge
                </button>
              )}
            </article>
          ))
        )}
      </section>
    </main>
  );
}
