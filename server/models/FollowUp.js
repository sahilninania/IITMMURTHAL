
const mongoose = require("mongoose");

const followUpSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, default: null, index: true },

    title: { type: String, required: true, maxlength: 150 },
    description: { type: String, maxlength: 1000 },

    dueAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },

    createdBy: {
      type: String,
      enum: ["doctor", "patient", "system"],
      required: true,
    },

    completedAt: { type: Date },
    completedBy: { type: String },
  },
  { timestamps: true }
);

followUpSchema.index({ patientId: 1, status: 1, dueAt: 1 });

module.exports =
  mongoose.models.FollowUp ||
  mongoose.model("FollowUp", followUpSchema);
