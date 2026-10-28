
const express = require("express");
const mongoose = require("mongoose");

const chatAuth = require("../middleware/chatAuth");
const PatientHealthProfile = require("../models/PatientHealthProfile");
const VitalReading = require("../models/VitalReading");
const CarePlan = require("../models/CarePlan");
const FollowUp = require("../models/FollowUp");
const HealthAlert = require("../models/HealthAlert");
const DoctorPatientAssignment = require("../models/DoctorPatientAssignment");

const {
  createHealthSummary,
} = require("../services/healthAnalysisService");

const router = express.Router();

router.use(chatAuth);

function requireDoctor(req, res, next) {
  if (String(req.chatUser?.role || "").toLowerCase() !== "doctor") {
    return res.status(403).json({ message: "Doctor access required." });
  }

  if (!req.chatUser?.id) {
    return res.status(401).json({ message: "Please log in again." });
  }

  next();
}

router.use(requireDoctor);

const doctorIdOf = (req) => String(req.chatUser.id);

async function hasAssignment(doctorId, patientId) {
  return Boolean(
    await DoctorPatientAssignment.exists({
      doctorId,
      patientId,
      status: "active",
    })
  );
}

// GET /api/doctor/health/patients
router.get("/patients", async (req, res) => {
  try {
    const assignments = await DoctorPatientAssignment.find({
      doctorId: doctorIdOf(req),
      status: "active",
    })
      .select("patientId assignedBy createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const patientIds = assignments.map((item) => item.patientId);

    const profiles = await PatientHealthProfile.find({
      userId: { $in: patientIds },
    }).lean();

    const profileById = new Map(
      profiles.map((profile) => [String(profile.userId), profile])
    );

    const patients = await Promise.all(
      assignments.map(async (assignment) => {
        const patientId = assignment.patientId;
        const profile = profileById.get(patientId);

        const latestReading = await VitalReading.findOne({ userId: patientId })
          .sort({ recordedAt: -1 })
          .select("recordedAt systolicBP diastolicBP heartRate temperatureC")
          .lean();

        const openAlerts = await HealthAlert.countDocuments({
          patientId,
          status: "open",
        });

        return {
          patientId,
          profile: profile || null,
          latestReading: latestReading || null,
          openAlerts,
        };
      })
    );

    res.json({ success: true, patients });
  } catch (error) {
    console.error("Doctor patient list error:", error.message);
    res.status(500).json({ message: "Could not load assigned patients." });
  }
});

// Shared patient details and analysis.
// GET /api/doctor/health/patients/:patientId
router.get("/patients/:patientId", async (req, res) => {
  try {
    const patientId = String(req.params.patientId || "");

    if (!patientId || patientId.length > 200) {
      return res.status(400).json({ message: "Invalid patient ID." });
    }

    if (!(await hasAssignment(doctorIdOf(req), patientId))) {
      return res.status(403).json({
        message: "This patient is not assigned to you.",
      });
    }

    const [profile, readings, alerts, followups, carePlans] =
      await Promise.all([
        PatientHealthProfile.findOne({ userId: patientId }).lean(),

        VitalReading.find({ userId: patientId })
          .sort({ recordedAt: -1 })
          .limit(30)
          .lean(),

        HealthAlert.find({ patientId })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),

        FollowUp.find({ patientId })
          .sort({ dueAt: 1 })
          .limit(50)
          .lean(),

        CarePlan.find({
          patientId,
          status: "active",
        })
          .sort({ updatedAt: -1 })
          .limit(20)
          .lean(),
      ]);

    let analysis = null;

    if (profile?.consentForHealthAnalysis) {
      analysis = await createHealthSummary({
        profile,
        readings: readings.slice(0, 14),
        carePlans: carePlans.filter((plan) => plan.approvedByDoctor),
      });
    }

    res.json({
      success: true,
      patientId,
      profile,
      readings,
      alerts,
      followups,
      carePlans,
      analysis,
      analysisNotice: profile?.consentForHealthAnalysis
        ? null
        : "Patient consent is required before AI health analysis.",
    });
  } catch (error) {
    console.error("Doctor patient details error:", error.message);
    res.status(500).json({
      message: "Could not load patient health details.",
    });
  }
});

// POST /api/doctor/health/patients/:patientId/analyze
router.post("/patients/:patientId/analyze", async (req, res) => {
  try {
    const patientId = String(req.params.patientId || "");

    if (!patientId || patientId.length > 200) {
      return res.status(400).json({ message: "Invalid patient ID." });
    }

    if (!(await hasAssignment(doctorIdOf(req), patientId))) {
      return res.status(403).json({
        message: "This patient is not assigned to you.",
      });
    }

    const profile = await PatientHealthProfile.findOne({
      userId: patientId,
    }).lean();

    if (!profile?.consentForHealthAnalysis) {
      return res.status(400).json({
        message: "Patient consent is required before AI analysis.",
      });
    }

    const [readings, carePlans] = await Promise.all([
      VitalReading.find({ userId: patientId })
        .sort({ recordedAt: -1 })
        .limit(14)
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

    const analysis = await createHealthSummary({
      profile,
      readings,
      carePlans,
    });

    res.json({
      success: true,
      patientId,
      analysis,
      basedOnReadings: readings.length,
      generatedAt: new Date(),
      disclaimer:
        "AI-generated decision support only. A clinician must review findings.",
    });
  } catch (error) {
    console.error("Doctor AI analysis error:", error.message);
    res.status(502).json({
      message: "AI health analysis is temporarily unavailable.",
    });
  }
});

module.exports = router;

