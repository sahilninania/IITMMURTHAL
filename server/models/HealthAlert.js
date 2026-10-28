
const mongoose = require("mongoose");

const healthAlertSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, default: null, index: true },

    type: {
      type: String,
      enum: ["trend", "symptom", "report", "followup"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["info", "review", "urgent"],
      required: true,
    },

    title: { type: String, required: true, maxlength: 150 },
    message: { type: String, required: true, maxlength: 2000 },
    sourceReadingId: { type: mongoose.Schema.Types.ObjectId, default: null },

    status: {
      type: String,
      enum: ["open", "reviewed", "resolved"],
      default: "open",
    },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

healthAlertSchema.index({ patientId: 1, status: 1, createdAt: -1 });

module.exports =
  mongoose.models.HealthAlert ||
  mongoose.model("HealthAlert", healthAlertSchema);
