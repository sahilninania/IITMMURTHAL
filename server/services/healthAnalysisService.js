
const Groq = require("groq-sdk");

function checkBasicFlags(reading) {
  const flags = [];

  // These are conservative demo flags, not a diagnostic protocol.
  if (
    reading.systolicBP != null &&
    reading.diastolicBP != null &&
    (reading.systolicBP >= 180 || reading.diastolicBP >= 120)
  ) {
    flags.push({
      severity: "urgent",
      title: "Very high blood pressure reading",
      message:
        "This reading may need urgent medical assessment. Recheck if safe to do so. If you have chest pain, breathlessness, weakness, confusion, or severe symptoms, seek emergency care now.",
    });
  }

  if (reading.heartRate != null &&
      (reading.heartRate < 40 || reading.heartRate > 150)) {
    flags.push({
      severity: "review",
      title: "Unusual heart-rate reading",
      message:
        "This reading is outside a broad typical adult resting range. Symptoms, age, activity and clinical context matter. Seek urgent help if you feel faint, have chest pain or breathing difficulty.",
    });
  }

  if (reading.temperatureC != null && reading.temperatureC >= 40) {
    flags.push({
      severity: "urgent",
      title: "Very high temperature reading",
      message:
        "A temperature this high can require urgent medical assessment. Seek prompt medical help, especially if there is confusion, breathing difficulty, severe weakness or worsening symptoms.",
    });
  }

  if (reading.symptomSeverity === "severe") {
    flags.push({
      severity: "urgent",
      title: "Severe symptoms reported",
      message:
        "Severe symptoms need prompt clinical assessment. For potentially life-threatening symptoms, contact local emergency services now.",
    });
  }

  return flags;
}

async function createHealthSummary({ profile, readings, carePlans }) {
  const latest = readings[0] || null;

  const flags = latest ? checkBasicFlags(latest) : [];

  if (!process.env.GROQ_API_KEY) {
    return {
      summary:
        "AI summary is unavailable. Your readings are saved, and basic safety checks have been performed.",
      flags,
      nextSteps: [
        "Continue recording relevant health readings.",
        "Follow your clinician's existing care plan.",
      ],
    };
  }

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
    timeout: 45000,
    maxRetries: 0,
  });

  // Limit history and only send fields needed for this summary.
  const safeContext = {
    conditions: (profile?.conditions || []).slice(0, 20),
    medicines: (profile?.medicines || [])
      .filter((m) => m.active)
      .slice(0, 20)
      .map((m) => ({
        name: m.name,
        prescribedDose: m.prescribedDose,
        frequency: m.frequency,
      })),
    readings: readings.slice(0, 14).map((r) => ({
      recordedAt: r.recordedAt,
      systolicBP: r.systolicBP,
      diastolicBP: r.diastolicBP,
      heartRate: r.heartRate,
      temperatureC: r.temperatureC,
      weightKg: r.weightKg,
      glucoseMgDl: r.glucoseMgDl,
      symptoms: r.symptoms,
      symptomSeverity: r.symptomSeverity,
      notes: r.notes,
    })),
    carePlans: carePlans.slice(0, 10).map((p) => ({
      title: p.title,
      instructions: p.instructions,
      nextReviewAt: p.nextReviewAt,
      status: p.status,
      approvedByDoctor: p.approvedByDoctor,
    })),
  };

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
    temperature: 0.2,
    max_completion_tokens: 700,
    messages: [
      {
        role: "system",
        content: `
You are a cautious health information assistant, not a diagnosing clinician.
Analyze only the supplied data. Do not invent missing values or claim a diagnosis.
Mention trends only when there are enough dated measurements to support them.
Distinguish observations from uncertainty.
Do not recommend changing or stopping medicines.
Do not create a new treatment plan or invent follow-up dates.
Use only existing doctor-approved care plans for care instructions.
Return valid JSON with exactly these keys:
{
  "summary": "short plain-language summary",
  "observations": ["data-grounded observations"],
  "nextSteps": ["safe, non-prescriptive actions"]
}
Keep the answer concise. Recommend clinician review when appropriate.
Do not use the AI summary to override urgent safety flags.
`,
      },
      {
        role: "user",
        content: JSON.stringify(safeContext),
      },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content || "";
  let result;

  try {
    const clean = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    result = JSON.parse(clean);
  } catch {
    result = {
      summary: raw.slice(0, 1500) ||
        "Unable to generate a summary.",
      observations: [],
      nextSteps: [
        "Follow your clinician's existing care plan.",
        "Contact your healthcare professional if you are concerned.",
      ],
    };
  }

  return {
    summary: String(result.summary || "").slice(0, 1500),
    observations: Array.isArray(result.observations)
      ? result.observations.slice(0, 8).map(String)
      : [],
    nextSteps: Array.isArray(result.nextSteps)
      ? result.nextSteps.slice(0, 8).map(String)
      : [],
    flags,
  };
}

module.exports = { checkBasicFlags, createHealthSummary };
