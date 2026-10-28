
const mongoose = require("mongoose");

const vitalReadingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    recordedAt: { type: Date, required: true, default: Date.now },

    systolicBP: { type: Number, min: 40, max: 300 },
    diastolicBP: { type: Number, min: 20, max: 200 },
    heartRate: { type: Number, min: 20, max: 250 },
    temperatureC: { type: Number, min: 25, max: 45 },
    weightKg: { type: Number, min: 1, max: 500 },
    glucoseMgDl: { type: Number, min: 10, max: 1500 },

    symptoms: [{ type: String, maxlength: 150 }],
    symptomSeverity: {
      type: String,
      enum: ["none", "mild", "moderate", "severe"],
      default: "none",
    },
    notes: { type: String, maxlength: 1000 },

    source: {
      type: String,
      enum: ["manual", "report"],
      default: "manual",
    },
  },
  { timestamps: true }
);

vitalReadingSchema.index({ userId: 1, recordedAt: -1 });

module.exports =
  mongoose.models.VitalReading ||
  mongoose.model("VitalReading", vitalReadingSchema);
