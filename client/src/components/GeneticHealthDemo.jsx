
import { useState } from "react";
import { demoGeneticPatient as demo } from "../data/demoGeneticPatient";
import "./GeneticHealthDemo.css";

export default function GeneticHealthDemo({ role = "patient" }) {
  const [showGenetics, setShowGenetics] = useState(true);
  const isDoctor = role === "doctor";
  const latest = demo.history[demo.history.length - 1];

  return (
    <main className="genetic-demo">
      <div className="gd-banner">
        FICTIONAL HACKATHON DEMO — NOT A REAL PATIENT OR GENETIC REPORT
      </div>

      <section className="gd-card gd-profile">
        <div>
          <span className="gd-label">PATIENT HEALTH PROFILE</span>
          <h2>{demo.patient.name}</h2>
          <p>
            {demo.patient.age} years · ID: {demo.patient.id}
          </p>
          <p>{demo.patient.conditions.join(", ")}</p>
        </div>

        <span className="gd-pill">
          {isDoctor ? "Doctor Review View" : "Patient View"}
        </span>
      </section>

      <section className="gd-stats">
        <article className="gd-card">
          <span>Latest BP</span>
          <strong>
            {latest.systolicBP}/{latest.diastolicBP}
          </strong>
          <small>mmHg · Demo reading</small>
        </article>

        <article className="gd-card">
          <span>Heart rate</span>
          <strong>{latest.heartRate} bpm</strong>
          <small>Demo reading</small>
        </article>

        <article className="gd-card">
          <span>Last visit</span>
          <strong>{demo.patient.lastVisit}</strong>
          <small>Fictional history</small>
        </article>

        <article className="gd-card">
          <span>Proposed review</span>
          <strong>{demo.patient.proposedReview}</strong>
          <small>Requires clinician confirmation</small>
        </article>
      </section>

      <section className="gd-card">
        <h3>Medical History</h3>

        <div className="gd-table-wrap">
          <table className="gd-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Blood pressure</th>
                <th>Heart rate</th>
                <th>Weight</th>
              </tr>
            </thead>

            <tbody>
              {demo.history.map((item) => (
                <tr key={item.date}>
                  <td>{item.date}</td>
                  <td>
                    {item.systolicBP}/{item.diastolicBP}
                  </td>
                  <td>{item.heartRate} bpm</td>
                  <td>{item.weightKg} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4>Family history</h4>
        {demo.familyHistory.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </section>

      <section className="gd-card">
        <div className="gd-section-heading">
          <div>
            <h3>Genetic AI Analysis</h3>
            <p>
              Educational interpretation of simulated genetic data.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowGenetics((value) => !value)}
          >
            {showGenetics ? "Hide report" : "Show report"}
          </button>
        </div>

        {showGenetics && (
          <>
            <div className="gd-warning">
              {demo.geneticReport.status}
            </div>

            {demo.geneticReport.variants.map((variant) => (
              <article className="gd-variant" key={variant.sampleId || variant.variant}>
                <strong>{variant.gene}</strong>
                <p>Variant: {variant.variant}</p>
                <p>Classification: {variant.classification}</p>
                <p>{variant.interpretation}</p>
              </article>
            ))}

            <h4>Genetic summary</h4>
            <p>{demo.aiAnalysis.geneticSummary}</p>
          </>
        )}
      </section>

      <section className="gd-card">
        <h3>AI Health Insights</h3>

        {demo.aiAnalysis.observations.map((item, index) => (
          <div className="gd-observation" key={index}>
            <span>{index + 1}</span>
            <p>{item}</p>
          </div>
        ))}

        <h4>Suggested review steps</h4>

        <ul>
          {demo.aiAnalysis.suggestedActions.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>

        {isDoctor && (
          <div className="gd-doctor-note">
            <h4>Doctor Review Panel</h4>
            <p>
              Review the original measurements, family history and any
              validated laboratory report before making clinical decisions.
            </p>
            <p>
              Proposed follow-up: {demo.aiAnalysis.proposedReview}
            </p>
            <p>
              Medication: {demo.medication.name}. No medication schedule
              is configured in this demo.
            </p>
          </div>
        )}
      </section>

      <p className="gd-disclaimer">
        This demo uses hardcoded sample data, not a live AI inference or
        genetic test. It does not diagnose conditions, calculate genetic
        disease probability, prescribe medication or automatically book
        an appointment.
      </p>
    </main>
  );
}
