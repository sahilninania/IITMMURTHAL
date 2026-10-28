
const mongoose = require("mongoose");

const doctorPatientAssignmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true,
      index: true,
    },
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    assignedBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

doctorPatientAssignmentSchema.index(
  { doctorId: 1, patientId: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.DoctorPatientAssignment ||
  mongoose.model("DoctorPatientAssignment", doctorPatientAssignmentSchema);
