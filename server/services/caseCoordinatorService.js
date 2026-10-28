
const {
  checkBasicFlags,
  createHealthSummary,
} = require("./healthAnalysisService");

function safeText(value, maxLength = 500) {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLength);
}

function getReadingSummary(readings = []) {
  const sorted = [...readings].sort(
    (a, b) => new Date(a.recordedAt) - new Date(b.recordedAt)
  );

  const latest = sorted[sorted.length - 1] || null;
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;

  return {
    totalReadings: sorted.length,
    latest: latest
      ? {
          recordedAt: latest.recordedAt,
          systolicBP: latest.systolicBP ?? null,
          diastolicBP: latest.diastolicBP ?? null,
          heartRate: latest.heartRate ?? null,
          temperatureC: latest.temperatureC ?? null,
          glucoseMgDl: latest.glucoseMgDl ?? null,
          symptoms: latest.symptoms || [],
          symptomSeverity: latest.symptomSeverity || "unknown",
        }
      : null,
    previous: previous
      ? {
          recordedAt: previous.recordedAt,
          systolicBP: previous.systolicBP ?? null,
          diastolicBP: previous.diastolicBP ?? null,
          heartRate: previous.heartRate ?? null,
          symptoms: previous.symptoms || [],
        }
      : null,
  };
}

function normalizeAnalysis(value) {
  if (typeof value === "string") {
    return {
      summary: value,
      observations: [],
      nextSteps: [],
      flags: [],
    };
  }

  if (!value || typeof value !== "object") {
    return {
      summary: "The AI did not return a structured summary.",
      observations: [],
      nextSteps: [],
      flags: [],
    };
  }

  return {
    summary: safeText(value.summary, 3000),
    observations: Array.isArray(value.observations)
      ? value.observations.slice(0, 10)
      : [],
    nextSteps: Array.isArray(value.nextSteps)
      ? value.nextSteps.slice(0, 10)
      : [],
    flags: Array.isArray(value.flags) ? value.flags.slice(0, 10) : [],
  };
}

async function buildCaseReview({ profile, readings, carePlans }) {
  const readingSummary = getReadingSummary(readings);

  const basicFlags = readingSummary.latest
    ? checkBasicFlags(readingSummary.latest)
    : [];

  const approvedCarePlans = (carePlans || []).filter(
    (plan) => plan.approvedByDoctor === true
  );

  const aiResult = await createHealthSummary({
    profile,
    readings,
    carePlans: approvedCarePlans,
  });

  const analysis = normalizeAnalysis(aiResult);

  const actions = [];

  if (!readings.length) {
    actions.push({
      type: "collect_data",
      priority: "routine",
      title: "Record health readings",
      message: "There are no recorded readings to review yet.",
      requiresClinician: false,
    });
  }

  if (basicFlags.length) {
    actions.push({
      type: "clinician_review",
      priority: "review",
      title: "Review health readings",
      message:
        "One or more readings triggered a basic health flag. Review the original measurements and clinical context.",
      requiresClinician: true,
    });
  }

  if (analysis.nextSteps.length) {
    actions.push({
      type: "care_guidance",
      priority: "routine",
      title: "AI suggested next steps",
      message:
        "Review the AI suggestions with the patient's existing care plan.",
      requiresClinician: true,
    });
  }

  if (!approvedCarePlans.length) {
    actions.push({
      type: "care_plan_review",
      priority: "routine",
      title: "Confirm care plan",
      message:
        "No active doctor-approved care plan was supplied to this review.",
      requiresClinician: true,
    });
  }

  return {
    generatedAt: new Date(),
    caseOverview: {
      recordedReadings: readingSummary.totalReadings,
      latestReading: readingSummary.latest,
      previousReading: readingSummary.previous,
      approvedCarePlans: approvedCarePlans.length,
    },
    analysis,
    basicFlags,
    actions,
    disclaimer:
      "AI decision support only. This review is not a diagnosis or prescription. A qualified clinician must confirm treatment changes and follow-up plans.",
  };
}

module.exports = { buildCaseReview };
