
const express = require("express");
const mongoose = require("mongoose");

const chatAuth = require("../middleware/chatAuth");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const CareTask = require("../models/CareTask");

const router = express.Router();

router.use(chatAuth);

const ACTIVE_STATUSES = ["requested", "confirmed"];
const SLOT_MINUTES = 30;
const SLOT_MS = SLOT_MINUTES * 60 * 1000;

function roleOf(req) {
  return String(req.chatUser?.role || "").toLowerCase();
}

function userIdOf(req) {
  return String(req.chatUser?.id || "");
}

function requireRole(req, res, allowedRoles) {
  if (!allowedRoles.includes(roleOf(req))) {
    res.status(403).json({
      success: false,
      message: "Your role cannot perform this action.",
    });
    return false;
  }

  if (!mongoose.isValidObjectId(userIdOf(req))) {
    res.status(401).json({
      success: false,
      message: "Invalid authenticated user.",
    });
    return false;
  }

  return true;
}

function validFutureDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime()) ||
    date.getTime() <= Date.now()
  ) {
    return null;
  }

  return date;
}

function isHalfHourSlot(date) {
  return (
    date.getMinutes() % SLOT_MINUTES === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  );
}

// Checks whether a slot overlaps another active appointment.
// App-level check only; production systems should also use
// a concurrency-safe booking strategy.
async function findAppointmentConflict({
  doctorId,
  patientId,
  appointmentAt,
  excludeAppointmentId = null,
}) {
  const query = {
    status: { $in: ACTIVE_STATUSES },
    appointmentAt: {
      $gte: new Date(appointmentAt.getTime() - SLOT_MS + 1),
      $lte: new Date(appointmentAt.getTime() + SLOT_MS - 1),
    },
    $or: [{ doctorId }, { patientId }],
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  return Appointment.findOne(query).lean();
}

// Update linked CareTask safely.
// CareTask.notes is a String, so $push must not be used.
async function updateLinkedCareTask(appointment, decision) {
  if (!appointment.relatedCareTask) return;

  const task = await CareTask.findOne({
    _id: appointment.relatedCareTask,
    patient: appointment.patientId,
  });

  if (!task) return;

  if (decision === "confirmed") {
    task.status = "upcoming";
    task.assignedDoctor = appointment.doctorId;
    task.dueAt = appointment.appointmentAt;
  } else if (decision === "rejected" || decision === "cancelled") {
    task.status = "pending";
  }

  task.notes = [
    task.notes,
    `Appointment ${decision}: ${appointment._id}`,
  ]
    .filter(Boolean)
    .join("\n");

  await task.save();
}

// GET /api/appointments/doctors
// Patient can view registered doctors.
router.get("/doctors", async (req, res) => {
  try {
    if (!requireRole(req, res, ["patient"])) return;

    const filter = { role: "doctor" };

    if (req.query.department) {
      filter.department = String(req.query.department).trim();
    }

    const doctors = await User.find(filter)
      .select("_id name department")
      .sort({ name: 1 })
      .limit(100)
      .lean();

    return res.json({
      success: true,
      doctors,
    });
  } catch (error) {
    console.error("Doctor list error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not load doctors.",
    });
  }
});

// GET /api/appointments/availability?doctorId=...&date=YYYY-MM-DD
// Demo schedule: 09:00–17:00, in 30-minute slots.
router.get("/availability", async (req, res) => {
  try {
    if (!requireRole(req, res, ["patient"])) return;

    const { doctorId, date } = req.query;

    if (!mongoose.isValidObjectId(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Valid doctorId is required.",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
      return res.status(400).json({
        success: false,
        message: "Date must use YYYY-MM-DD format.",
      });
    }

    const doctor = await User.findOne({
      _id: doctorId,
      role: "doctor",
    })
      .select("_id")
      .lean();

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    const [year, month, day] = date.split("-").map(Number);

    const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

    if (
      Number.isNaN(dayStart.getTime()) ||
      dayStart.getFullYear() !== year ||
      dayStart.getMonth() !== month - 1 ||
      dayStart.getDate() !== day
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar date.",
      });
    }

    const appointments = await Appointment.find({
      doctorId,
      status: { $in: ACTIVE_STATUSES },
      appointmentAt: { $gte: dayStart, $lt: dayEnd },
    })
      .select("appointmentAt")
      .lean();

    const busyTimes = appointments.map((item) =>
      new Date(item.appointmentAt).getTime()
    );

    const slots = [];
    const now = Date.now();

    for (
      let minutes = 9 * 60;
      minutes < 17 * 60;
      minutes += SLOT_MINUTES
    ) {
      const slot = new Date(
        year,
        month - 1,
        day,
        Math.floor(minutes / 60),
        minutes % 60,
        0,
        0
      );

      const slotTime = slot.getTime();

      if (slotTime <= now) continue;

      const conflicts = busyTimes.some(
        (busyTime) => Math.abs(busyTime - slotTime) < SLOT_MS
      );

      if (!conflicts) {
        slots.push({
          startAt: slot.toISOString(),
          label: slot.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }
    }

    return res.json({
      success: true,
      doctorId,
      date,
      slotDurationMinutes: SLOT_MINUTES,
      scheduleNote:
        "Demo hours only (09:00–17:00). Verify the doctor's actual working hours before production use.",
      slots,
    });
  } catch (error) {
    console.error("Appointment availability error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not check appointment availability.",
    });
  }
});

// POST /api/appointments
// Patient requests an appointment; the doctor must confirm it.
router.post("/", async (req, res) => {
  try {
    if (!requireRole(req, res, ["patient"])) return;

    const patientId = userIdOf(req);

    const {
      doctorId,
      appointmentAt,
      reason,
      patientNotes = "",
      relatedCareTask = null,
    } = req.body;

    if (!mongoose.isValidObjectId(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid doctor.",
      });
    }

    if (
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.trim().length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Appointment reason is required (maximum 1000 characters).",
      });
    }

    if (
      typeof patientNotes !== "string" ||
      patientNotes.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Patient notes must be at most 2000 characters.",
      });
    }

    const appointmentDate = validFutureDate(appointmentAt);

    if (!appointmentDate) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid future appointment time.",
      });
    }

    if (!isHalfHourSlot(appointmentDate)) {
      return res.status(400).json({
        success: false,
        message: "Choose a listed 30-minute appointment slot.",
      });
    }

    const doctor = await User.findOne({
      _id: doctorId,
      role: "doctor",
    })
      .select("_id name department")
      .lean();

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    let careTask = null;

    if (relatedCareTask) {
      if (!mongoose.isValidObjectId(relatedCareTask)) {
        return res.status(400).json({
          success: false,
          message: "Invalid care task ID.",
        });
      }

      careTask = await CareTask.findOne({
        _id: relatedCareTask,
        patient: patientId,
      });

      if (!careTask) {
        return res.status(404).json({
          success: false,
          message: "Care task not found for this patient.",
        });
      }
    }

    const conflict = await findAppointmentConflict({
      doctorId,
      patientId,
      appointmentAt: appointmentDate,
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message:
          "This slot conflicts with an existing active appointment. Choose another slot.",
      });
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      department: doctor.department || "General Medicine",
      reason: reason.trim(),
      appointmentAt: appointmentDate,
      status: "requested",
      patientNotes: patientNotes.trim(),
      relatedCareTask: careTask?._id || null,
      createdBy: "patient",
    });

    if (careTask) {
      careTask.assignedDoctor = doctor._id;
      careTask.type = "appointment";
      careTask.dueAt = appointmentDate;
      careTask.notes = [
        careTask.notes,
        `Appointment request created: ${appointment._id}`,
      ]
        .filter(Boolean)
        .join("\n");

      await careTask.save();
    }

    return res.status(201).json({
      success: true,
      message: "Appointment request sent to the doctor for confirmation.",
      appointment,
    });
  } catch (error) {
    console.error("Appointment request error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not create the appointment request.",
    });
  }
});

// GET /api/appointments/mine
// Patient sees their own requests and bookings.
router.get("/mine", async (req, res) => {
  try {
    if (!requireRole(req, res, ["patient"])) return;

    const appointments = await Appointment.find({
      patientId: userIdOf(req),
    })
      .populate("doctorId", "name department")
      .sort({ appointmentAt: -1 })
      .limit(100)
      .lean();

    return res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Patient appointments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not load your appointments.",
    });
  }
});

// GET /api/appointments/doctor/requests
// Doctor sees only requests assigned to their account.
router.get("/doctor/requests", async (req, res) => {
  try {
    if (!requireRole(req, res, ["doctor"])) return;

    const appointments = await Appointment.find({
      doctorId: userIdOf(req),
      status: "requested",
    })
      .populate("patientId", "name email")
      .sort({ appointmentAt: 1 })
      .limit(100)
      .lean();

    return res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Doctor appointment requests error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not load appointment requests.",
    });
  }
});

// PATCH /api/appointments/:id/respond
// Doctor confirms or rejects their own pending request.
router.patch("/:id/respond", async (req, res) => {
  try {
    if (!requireRole(req, res, ["doctor"])) return;

    const { decision, doctorNotes = "" } = req.body;

    if (!["confirmed", "rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Decision must be "confirmed" or "rejected".',
      });
    }

    if (
      typeof doctorNotes !== "string" ||
      doctorNotes.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Doctor notes must be at most 2000 characters.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: userIdOf(req),
      status: "requested",
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Pending appointment request not found.",
      });
    }

    if (decision === "confirmed") {
      if (appointment.appointmentAt <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "This appointment time has already passed.",
        });
      }

      const conflict = await findAppointmentConflict({
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        appointmentAt: appointment.appointmentAt,
        excludeAppointmentId: appointment._id,
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message:
            "This time conflicts with another active appointment. Arrange another time before confirming.",
        });
      }
    }

    appointment.status = decision;
    appointment.doctorNotes = doctorNotes.trim();
    await appointment.save();

    await updateLinkedCareTask(appointment, decision);

    return res.json({
      success: true,
      message:
        decision === "confirmed"
          ? "Appointment confirmed."
          : "Appointment request rejected.",
      appointment,
    });
  } catch (error) {
    console.error("Appointment response error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not update appointment request.",
    });
  }
});

// PATCH /api/appointments/:id/cancel
// Patient can cancel their own requested/confirmed appointment.
router.patch("/:id/cancel", async (req, res) => {
  try {
    if (!requireRole(req, res, ["patient"])) return;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID.",
      });
    }

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        patientId: userIdOf(req),
        status: { $in: ACTIVE_STATUSES },
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Active appointment not found.",
      });
    }

    await updateLinkedCareTask(appointment, "cancelled");

    return res.json({
      success: true,
      message: "Appointment cancelled.",
      appointment,
    });
  } catch (error) {
    console.error("Appointment cancellation error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not cancel appointment.",
    });
  }
});

module.exports = router;
