
const express = require("express");
const mongoose = require("mongoose");

const chatAuth = require("../middleware/chatAuth");
const PatientHealthProfile = require("../models/PatientHealthProfile");
const VitalReading = require("../models/VitalReading");
const CarePlan = require("../models/CarePlan");
const FollowUp = require("../models/FollowUp");
const MedicationSchedule = require("../models/MedicationSchedule");
const HealthAlert = require("../models/HealthAlert");
const { buildCaseReview } = require("../services/caseCoordinatorService.js");

const {
  checkBasicFlags,
  createHealthSummary,
} = require("../services/healthAnalysisService");

const router = express.Router();

router.use(chatAuth);

const PATIENT_ROLES = ["patient"];
const DOCTOR_ROLES = ["doctor"];
const roleOf = (req) => String(req.chatUser?.role || "").toLowerCase();
const userIdOf = (req) => String(req.chatUser?.id || "");

function requireRole(roles, req, res) {
  if (!roles.includes(roleOf(req))) {
    res.status(403).json({ message: "Your role cannot perform this action." });
    return false;
  }
  return true;
}

// GET /api/health/profile
router.get("/profile", async (req, res) => {
  try {
    if (!requireRole(PATIENT_ROLES, req, res)) return;

    const profile = await PatientHealthProfile.findOne({
      userId: userIdOf(req),
    }).lean();

    res.json({ success: true, profile });
  } catch (error) {
    console.error("Health profile read error:", error.message);
    res.status(500).json({ message: "Could not load health profile." });
  }
});

// PUT /api/health/profile
router.put("/profile", async (req, res) => {
  try {
    if (!requireRole(PATIENT_ROLES, req, res)) return;

    const allowed = [
      "dateOfBirth",
      "sex",
      "heightCm",
      "weightKg",
      "bloodGroup",
      "conditions",
      "allergies",
      "familyHistory",
      "medicines",
      "lifestyle",
      "emergencyContact",
      "profileNotes",
      "consentForHealthAnalysis",
    ];

    const updates = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    const profile = await PatientHealthProfile.findOneAndUpdate(
      { userId: userIdOf(req) },
      { $set: updates, $setOnInsert: { userId: userIdOf(req) } },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, profile });
  } catch (error) {
    console.error("Health profile save error:", error.message);
    res.status(400).json({ message: "Invalid health profile data." });
  }
});

// POST /api/health/readings
router.post("/readings", async (req, res) => {
  try {
    if (!requireRole(PATIENT_ROLES, req, res)) return;

    const profile = await PatientHealthProfile.findOne({
      userId: userIdOf(req),
    }).lean();

    if (!profile?.consentForHealthAnalysis) {
      return res.status(400).json({
        message: "Please save your profile and consent to health analysis first.",
      });
    }

    const allowed = [
      "recordedAt",
      "systolicBP",
      "diastolicBP",
      "heartRate",
      "temperatureC",
      "weightKg",
      "glucoseMgDl",
      "symptoms",
      "symptomSeverity",
      "notes",
    ];

    const data = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        data[key] = req.body[key];
      }
    }

    const hasMeasurement = allowed.some(
      (key) =>
        !["recordedAt", "symptoms", "symptomSeverity", "notes"].includes(key) &&
        data[key] !== undefined &&
        data[key] !== null &&
        data[key] !== ""
    );

    if (!hasMeasurement && !(data.symptoms?.length)) {
      return res.status(400).json({
        message: "Enter at least one health reading or symptom.",
      });
    }

    if (data.recordedAt && Number.isNaN(Date.parse(data.recordedAt))) {
      return res.status(400).json({ message: "Invalid reading date." });
    }

    data.userId = userIdOf(req);
    data.source = "manual";

    const reading = await VitalReading.create(data);

    const flags = checkBasicFlags(reading);

    if (flags.length) {
      const profile = await PatientHealthProfile.findOne({
        userId: userIdOf(req),
      }).lean();

      // Doctor assignment is intentionally not guessed here.
      await HealthAlert.insertMany(
        flags.map((flag) => ({
          patientId: userIdOf(req),
          type: "trend",
          severity: flag.severity,
          title: flag.title,
          message: flag.message,
          sourceReadingId: reading._id,
        }))
      );
    }

    res.status(201).json({
      success: true,
      reading,
      flags,
      message: "Health reading saved.",
    });
  } catch (error) {
    console.error("Health reading save error:", error.message);
    res.status(400).json({ message: "Could not save this reading." });
  }
});

// GET /api/health/readings?limit=30
router.get("/readings", async (req, res) => {
  try {
    if (!requireRole(PATIENT_ROLES, req, res)) return;

    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 30, 1),
      100
    );

    const readings = await VitalReading.find({
      userId: userIdOf(req),
    })
      .sort({ recordedAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, readings });
  } catch (error) {
    console.error("Health readings error:", error.message);
    res.status(500).json({ message: "Could not load readings." });
  }
});

// POST /api/health/analyze
router.post("/analyze", async (req, res) => {
  try {
    if (!requireRole(PATIENT_ROLES, req, res)) return;

    const profile = await PatientHealthProfile.findOne({
      userId: userIdOf(req),
    }).lean();

    if (!profile?.consentForHealthAnalysis) {
      return res.status(400).json({
        message: "Health analysis consent is required.",
      });
    }

    const [readings, carePlans] = await Promise.all([
      VitalReading.find({ userId: userIdOf(req) })
        .sort({ recordedAt: -1 })
        .limit(14)
        .lean(),
      CarePlan.find({
        patientId: userIdOf(req),
        status: "active",
        approvedByDoctor: true,
      })
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const analysis = await createHealthSummary({
      profile,
      readings,
      carePlans,
    });

    res.json({
      success: true,
      analysis,
      basedOnReadings: readings.length,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Health analysis error:", error.message);
    res.status(502).json({
      message: "Health analysis is temporarily unavailable.",
    });
  }
});

// GET /api/health/followups
router.get("/followups", async (req, res) => {
  try {
    if (!requireRole(PATIENT_ROLES, req, res)) return;

    const followups = await FollowUp.find({
      patientId: userIdOf(req),
    })
      .sort({ dueAt: 1 })
      .limit(100)
      .lean();

    res.json({ success: true, followups });
  } catch (error) {
    console.error("Follow-ups read error:", error.message);
    res.status(500).json({ message: "Could not load follow-ups." });
  }
});

// Patient can complete only their own follow-up.
router.patch("/followups/:id/complete", async (req, res) => {
  try {
    if (!requireRole(PATIENT_ROLES, req, res)) return;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid follow-up ID." });
    }

    const followup = await FollowUp.findOneAndUpdate(
      {
        _id: req.params.id,
        patientId: userIdOf(req),
        status: "pending",
      },
      {
        $set: {
          status: "completed",
          completedAt: new Date(),
          completedBy: userIdOf(req),
        },
      },
      { new: true, runValidators: true }
    );

    if (!followup) {
      return res.status(404).json({
        message: "Pending follow-up not found.",
      });
    }

    res.json({ success: true, followup });
  } catch (error) {
    console.error("Follow-up completion error:", error.message);
    res.status(500).json({ message: "Could not complete follow-up." });
  }
});

// GET /api/health/alerts
router.get("/alerts", async (req, res) => {
  try {
    if (!requireRole(PATIENT_ROLES, req, res)) return;

    const alerts = await HealthAlert.find({
      patientId: userIdOf(req),
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, alerts });
  } catch (error) {
    console.error("Health alerts error:", error.message);
    res.status(500).json({ message: "Could not load health alerts." });
  }
});

// Patient can acknowledge their own alert.
router.patch("/alerts/:id/reviewed", async (req, res) => {
  try {
    if (!requireRole(PATIENT_ROLES, req, res)) return;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid alert ID." });
    }

    const alert = await HealthAlert.findOneAndUpdate(
      {
        _id: req.params.id,
        patientId: userIdOf(req),
        status: "open",
      },
      { $set: { status: "reviewed" } },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: "Open alert not found." });
    }

    res.json({ success: true, alert });
  } catch (error) {
    console.error("Alert update error:", error.message);
    res.status(500).json({ message: "Could not update alert." });
  }
});

function parseDemoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// POST /api/health/demo-seed
// Creates fictional data only for the logged-in patient account.
router.post("/demo-seed", async (req, res) => {
  try {
    if (!requireRole(PATIENT_ROLES, req, res)) return;

    const patientId = userIdOf(req);
    
const [existingProfile, existingReading] = await Promise.all([
  PatientHealthProfile.findOne({ userId: patientId }),
  VitalReading.findOne({ userId: patientId }),
]);

if (existingProfile || existingReading) {
  return res.status(409).json({
    message:
      "Demo seed is only allowed on an empty test patient account. Existing health data was not changed.",
  });
}


    // Avoid repeatedly duplicating demo records.
    const existing = await PatientHealthProfile.findOne({
      userId: patientId,
      profileNotes: { $regex: "\\[DEMO PATIENT DATA\\]" },
    });

    if (existing) {
      return res.status(409).json({
        message: "Demo data has already been added to this account.",
      });
    }

    const profile = await PatientHealthProfile.findOneAndUpdate(
      { userId: patientId },
      {
        $set: {
          dateOfBirth: new Date("1981-05-12"),
          heightCm: 172,
          weightKg: 84,
          bloodGroup: "unknown",
          conditions: ["Demo: hypertension"],
          allergies: [],
          familyHistory: [],
          medicines: [],
          profileNotes:
            "[DEMO PATIENT DATA] Fictional example only. Not a real medical record.",
          consentForHealthAnalysis: true,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    const existingReadings = await VitalReading.find({
      userId: patientId,
      notes: { $regex: "\\[DEMO PATIENT DATA\\]" },
    }).limit(1);

    if (!existingReadings.length) {
      await VitalReading.insertMany([
        {
          userId: patientId,
          recordedAt: new Date("2026-10-20T08:00:00"),
          systolicBP: 150,
          diastolicBP: 95,
          heartRate: 88,
          weightKg: 85,
          symptoms: [],
          symptomSeverity: "none",
          notes: "[DEMO PATIENT DATA] Fictional historical reading.",
          source: "manual",
        },
        {
          userId: patientId,
          recordedAt: new Date("2026-10-27T08:00:00"),
          systolicBP: 146,
          diastolicBP: 92,
          heartRate: 84,
          weightKg: 84,
          symptoms: [],
          symptomSeverity: "none",
          notes: "[DEMO PATIENT DATA] Fictional recent reading.",
          source: "manual",
        },
      ]);
    }

    // Demo plan is explicitly unapproved until a clinician reviews it.
    await CarePlan.findOneAndUpdate(
      { patientId, title: "Demo blood-pressure follow-up plan" },
      {
        $setOnInsert: {
          patientId,
          doctorId: null,
          title: "Demo blood-pressure follow-up plan",
          instructions:
            "Fictional demo only. A clinician must review and approve all care instructions.",
          startDate: new Date("2026-10-20"),
          nextReviewAt: new Date("2026-11-03"),
          followUpIntervalDays: 14,
          status: "active",
          approvedByDoctor: false,
        },
      },
      { upsert: true, new: true }
    );

    await FollowUp.findOneAndUpdate(
      { patientId, title: "Demo: clinician review" },
      {
        $setOnInsert: {
          patientId,
          doctorId: null,
          title: "Demo: clinician review",
          description:
            "Review the fictional readings and confirm an appropriate follow-up plan.",
          dueAt: new Date("2026-11-03T10:00:00"),
          status: "pending",
          createdBy: "system",
        },
      },
      { upsert: true, new: true }
    );

    await MedicationSchedule.findOneAndUpdate(
      { patientId, medicineName: "DEMO ONLY - clinician to specify" },
      {
        $setOnInsert: {
          patientId,
          doctorId: null,
          medicineName: "DEMO ONLY - clinician to specify",
          prescribedDose: "Not prescribed",
          instructions:
            "Placeholder only. No medicine has been prescribed. Do not take medication based on this demo.",
          times: [],
          startDate: new Date("2026-10-28"),
          status: "paused",
          approvedByDoctor: false,
          createdBy: patientId,
        },
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      message: "Fictional demo history added to your account.",
      patientProfileId: String(profile._id),
      note: "Demo records must not be treated as real clinical data.",
    });
  } catch (error) {
    console.error("Demo seed error:", error.message);
    res.status(500).json({ message: "Could not create demo data." });
  }
});

// GET /api/health/medications
router.get("/medications", async (req, res) => {
  try {
    if (!requireRole(PATIENT_ROLES, req, res)) return;

    const medications = await MedicationSchedule.find({
      patientId: userIdOf(req),
    })
      .sort({ startDate: -1 })
      .lean();

    res.json({ success: true, medications });
  } catch (error) {
    console.error("Medication list error:", error.message);
    res.status(500).json({ message: "Could not load medicine schedules." });
  }
});

// GET /api/health/reminders
// Returns due check-ups and today's approved medication reminder times.
router.get("/reminders", async (req, res) => {
  try {
    if (!requireRole(PATIENT_ROLES, req, res)) return;

    const patientId = userIdOf(req);
    const now = new Date();

    const [followups, plans, medications] = await Promise.all([
      FollowUp.find({
        patientId,
        status: "pending",
        dueAt: { $lte: new Date(now.getTime() + 30 * 86400000) },
      }).sort({ dueAt: 1 }).limit(50).lean(),

      CarePlan.find({
        patientId,
        status: "active",
        approvedByDoctor: true,
        nextReviewAt: { $ne: null },
      }).sort({ nextReviewAt: 1 }).limit(20).lean(),

      MedicationSchedule.find({
        patientId,
        status: "active",
        approvedByDoctor: true,
        startDate: { $lte: now },
        $or: [{ endDate: null }, { endDate: { $gte: now } }],
      }).lean(),
    ]);

    const medicationReminders = medications.flatMap((med) =>
      (med.times || []).map((time) => ({
        type: "medication",
        medicineName: med.medicineName,
        prescribedDose: med.prescribedDose,
        time,
        instructions: med.instructions || "",
      }))
    );

    res.json({
      success: true,
      generatedAt: now,
      followups: followups.map((item) => ({
        id: String(item._id),
        title: item.title,
        dueAt: item.dueAt,
        status: item.status,
      })),
      carePlanReviews: plans.map((plan) => ({
        title: plan.title,
        nextReviewAt: plan.nextReviewAt,
      })),
      medicationReminders,
      note: "These are dashboard reminders, not proof of a notification being delivered or medicine being taken.",
    });
  } catch (error) {
    console.error("Reminder list error:", error.message);
    res.status(500).json({ message: "Could not load reminders." });
  }
});

// POST /api/health/medications/:id/acknowledge
// Acknowledges a reminder only; does not confirm ingestion.
router.post("/medications/:id/acknowledge", async (req, res) => {
  try {
    if (!requireRole(PATIENT_ROLES, req, res)) return;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid medication ID." });
    }

    const { scheduledAt, status } = req.body;

    if (!["acknowledged", "skipped"].includes(status)) {
      return res.status(400).json({ message: "Invalid reminder status." });
    }

    const scheduledDate = parseDemoDate(scheduledAt);
    if (!scheduledDate) {
      return res.status(400).json({ message: "Valid scheduledAt is required." });
    }

    const medication = await MedicationSchedule.findOne({
      _id: req.params.id,
      patientId: userIdOf(req),
      status: "active",
      approvedByDoctor: true,
    });

    if (!medication) {
      return res.status(404).json({
        message: "Approved active medication schedule not found.",
      });
    }

    medication.acknowledgements.push({
      scheduledAt: scheduledDate,
      status,
      recordedAt: new Date(),
    });

    await medication.save();

    res.json({
      success: true,
      message: "Reminder status saved; medicine intake has not been verified.",
    });
  } catch (error) {
    console.error("Medication acknowledgement error:", error.message);
    res.status(400).json({ message: "Could not save reminder status." });
  }
});


router.post("/case-review", async (req, res) => {
  try {
    if (!requireRole(PATIENT_ROLES, req, res)) return;

    const patientId = userIdOf(req);

    const profile = await PatientHealthProfile.findOne({
      userId: patientId,
    }).lean();

    if (!profile?.consentForHealthAnalysis) {
      return res.status(400).json({
        message: "Please enable health-analysis consent in your profile first.",
      });
    }

    const [readings, carePlans] = await Promise.all([
      VitalReading.find({ userId: patientId })
        .sort({ recordedAt: -1 })
        .limit(30)
        .lean(),

      CarePlan.find({
        patientId,
        status: "active",
        approvedByDoctor: true,
      })
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const review = await buildCaseReview({
      profile,
      readings,
      carePlans,
    });

    res.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Agent case review error:", error.message);
    res.status(502).json({
      message: "The case review is temporarily unavailable.",
    });
  }
});


router.post("/case-review", async (req, res) => {
  try {
    if (!requireRole(PATIENT_ROLES, req, res)) return;

    const patientId = userIdOf(req);

    const profile = await PatientHealthProfile.findOne({
      userId: patientId,
    }).lean();

    if (!profile || !profile.consentForHealthAnalysis) {
      return res.status(400).json({
        message:
          "Please enable and save health-analysis consent first.",
      });
    }

    const [readings, carePlans] = await Promise.all([
      VitalReading.find({ userId: patientId })
        .sort({ recordedAt: -1 })
        .limit(30)
        .lean(),

      CarePlan.find({
        patientId,
        status: "active",
        approvedByDoctor: true,
      })
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const review = await buildCaseReview({
      profile,
      readings,
      carePlans,
    });

    return res.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Agent case review error:", error);

    return res.status(502).json({
      message: "The patient case review failed. Check the server logs.",
    });
  }
});


module.exports = router;
