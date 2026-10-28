
import React from "react";
import "./PatientDemoData.css";

const patient = {
  name: "Rahul Sharma",
  age: 45,
  patientId: "DEMO-1001",
  condition: "Demo: High blood pressure",
  lastVisit: "20 Oct 2026",
  nextCheckup: "3 Nov 2026",
  status: "Needs clinician review",
};

const history = [
  {
    date: "20 Oct 2026",
    bp: "150/95",
    heartRate: 88,
    weight: "85 kg",
  },
  {
    date: "24 Oct 2026",
    bp: "148/94",
    heartRate: 86,
    weight: "84.5 kg",
  },
  {
    date: "27 Oct 2026",
    bp: "146/92",
    heartRate: 84,
    weight: "84 kg",
  },
];

const medications = [
  {
    name: "Demo medicine placeholder",
    dose: "Not prescribed",
    timing: "No schedule",
    status: "Awaiting doctor approval",
  },
];

const reminders = [
  {
    title: "Clinician review",
    date: "3 Nov 2026",
    description: "Review the demo readings and decide the follow-up plan.",
  },
  {
    title: "Blood pressure tracking",
    date: "Daily",
    description: "Record readings according to the clinician's instructions.",
  },
];

export default function PatientDemoData() {
  return (
    <div className="demo-health">
      <div className="demo-banner">
        DEMO DATA — fictional patient, not a real medical record.
      </div>

      <section className="demo-patient-card">
        <div>
          <p className="demo-eyebrow">PATIENT HEALTH PROFILE</p>
          <h2>{patient.name}</h2>
          <p>
            {patient.age} years · Patient ID: {patient.patientId}
          </p>
          <p>{patient.condition}</p>
        </div>

        <span className="demo-status">{patient.status}</span>
      </section>

      <div className="demo-stats">
        <article className="demo-card">
          <span>Latest BP</span>
          <h3>146/92</h3>
          <p>mmHg · 27 Oct 2026</p>
        </article>

        <article className="demo-card">
          <span>Heart Rate</span>
          <h3>84 bpm</h3>
          <p>Latest demo reading</p>
        </article>

        <article className="demo-card">
          <span>Last Visit</span>
          <h3>{patient.lastVisit}</h3>
          <p>Fictional history</p>
        </article>

        <article className="demo-card">
          <span>Next Review</span>
          <h3>{patient.nextCheckup}</h3>
          <p>Proposed demo date</p>
        </article>
      </div>

      <section className="demo-section">
        <h3>Previous Health Readings</h3>
        <div className="demo-table-wrap">
          <table className="demo-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Blood Pressure</th>
                <th>Heart Rate</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {history.map((reading) => (
                <tr key={reading.date}>
                  <td>{reading.date}</td>
                  <td>{reading.bp}</td>
                  <td>{reading.heartRate} bpm</td>
                  <td>{reading.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="demo-section">
        <h3>AI Trend Summary — Illustrative</h3>
        <div className="demo-ai">
          <strong>Trend to review</strong>
          <p>
            The fictional BP readings decreased from 150/95 to 146/92,
            but the latest reading remains elevated. A clinician should
            review the measurements and determine the appropriate next step.
          </p>
          <p>
            This is a simple demo summary, not a live AI diagnosis or
            personalized treatment recommendation.
          </p>
        </div>
      </section>

      <section className="demo-section">
        <h3>Medicine Schedule</h3>
        {medications.map((medication) => (
          <div className="demo-list-item" key={medication.name}>
            <div>
              <strong>{medication.name}</strong>
              <p>Dose: {medication.dose}</p>
              <p>Timing: {medication.timing}</p>
            </div>
            <span className="demo-status">{medication.status}</span>
          </div>
        ))}
        <p className="demo-note">
          No actual medicine is prescribed by this demo. Only display a
          real medicine schedule after it has been approved by a doctor.
        </p>
      </section>

      <section className="demo-section">
        <h3>Upcoming Reminders</h3>
        {reminders.map((reminder) => (
          <div className="demo-list-item" key={reminder.title}>
            <div>
              <strong>{reminder.title}</strong>
              <p>{reminder.description}</p>
            </div>
            <span className="demo-date">{reminder.date}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
