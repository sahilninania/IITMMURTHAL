
export const demoGeneticPatient = {
  isDemo: true,

  patient: {
    id: "DEMO-1001",
    name: "Rahul Sharma",
    age: 45,
    sex: "male",
    conditions: ["Demo: elevated blood pressure readings"],
    allergies: ["Not provided"],
    lastVisit: "2026-10-20",
    proposedReview: "2026-11-03",
  },

  history: [
    {
      date: "2026-10-20",
      systolicBP: 150,
      diastolicBP: 95,
      heartRate: 88,
      weightKg: 85,
    },
    {
      date: "2026-10-24",
      systolicBP: 148,
      diastolicBP: 94,
      heartRate: 86,
      weightKg: 84.5,
    },
    {
      date: "2026-10-27",
      systolicBP: 146,
      diastolicBP: 92,
      heartRate: 84,
      weightKg: 84,
    },
  ],

  familyHistory: [
    "Demo: one parent reported to have high blood pressure",
  ],

  geneticReport: {
    status: "SIMULATED — NOT A REAL GENETIC TEST",
    sampleId: "DEMO-GEN-001",
    variants: [
      {
        gene: "GENE-DEMO-A",
        variant: "SIMULATED-VARIANT-01",
        classification: "Unclassified demo variant",
        interpretation:
          "This invented example has no established clinical meaning. It cannot be used to infer disease risk.",
      },
      {
        gene: "GENE-DEMO-B",
        variant: "SIMULATED-VARIANT-02",
        classification: "Unclassified demo variant",
        interpretation:
          "No pathogenicity or disease association is asserted. A real result would require validated laboratory interpretation.",
      },
    ],
  },

  aiAnalysis: {
    title: "Demo AI Health Analysis",
    observations: [
      "Blood pressure readings decreased from 150/95 to 146/92 across the recorded demo dates.",
      "The latest demo reading is still elevated and merits review by a qualified clinician.",
      "Three readings are insufficient to establish a diagnosis or determine a long-term trend.",
    ],

    geneticSummary:
      "The genetic section contains invented demonstration variants only. No genetic disease risk can be calculated from these entries.",

    suggestedActions: [
      "Verify measurements and review the patient's clinical history.",
      "Have a clinician determine the appropriate follow-up date.",
      "Use only validated genetic test reports for any future genetic interpretation.",
    ],

    proposedReview: "2026-11-03",
  },

  medication: {
    name: "No medicine prescribed in this demo",
    dose: "Not prescribed",
    schedule: "Not configured",
  },
};
