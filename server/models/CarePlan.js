
const mongoose = require("mongoose");

const carePlanSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },

    title: { type: String, required: true, maxlength: 150 },
    instructions: { type: String, required: true, maxlength: 3000 },

    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },

    followUpIntervalDays: { type: Number, min: 1, max: 365 },
    nextReviewAt: { type: Date },

    approvedByDoctor: { type: Boolean, default: false },
  },
  { timestamps: true }
);

carePlanSchema.index({ patientId: 1, status: 1 });

module.exports =
  mongoose.models.CarePlan ||
  mongoose.model("CarePlan", carePlanSchema);
