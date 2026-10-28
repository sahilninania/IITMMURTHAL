
const mongoose = require("mongoose");

const medicationScheduleSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, default: null, index: true },

    medicineName: { type: String, required: true, maxlength: 150 },
    prescribedDose: { type: String, required: true, maxlength: 100 },
    instructions: { type: String, maxlength: 500 },

    // Use 24-hour local time, e.g. ["08:00", "20:00"].
    times: [{
      type: String,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    }],

    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },

    status: {
      type: String,
      enum: ["active", "paused", "completed"],
      default: "active",
    },

    approvedByDoctor: { type: Boolean, default: false },
    createdBy: { type: String, required: true },

    // Track reminder acknowledgements without claiming medicine was taken.
    acknowledgements: [{
      scheduledAt: { type: Date, required: true },
      status: {
        type: String,
        enum: ["acknowledged", "skipped"],
        required: true,
      },
      recordedAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

medicationScheduleSchema.index({ patientId: 1, status: 1, startDate: 1 });

module.exports =
  mongoose.models.MedicationSchedule ||
  mongoose.model("MedicationSchedule", medicationScheduleSchema);
