
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    department: {
      type: String,
      default: "General Medicine",
      trim: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    appointmentAt: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "requested",
        "confirmed",
        "completed",
        "cancelled",
        "rejected",
      ],
      default: "requested",
      index: true,
    },

    patientNotes: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    doctorNotes: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    relatedCareTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CareTask",
      default: null,
    },

    createdBy: {
      type: String,
      enum: ["patient", "doctor"],
      default: "patient",
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent overlapping active appointments for the same doctor.
// The booking API must still check availability before saving.
appointmentSchema.index({
  doctorId: 1,
  appointmentAt: 1,
  status: 1,
});

module.exports =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);
