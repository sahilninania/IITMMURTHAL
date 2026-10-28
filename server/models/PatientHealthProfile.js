
const mongoose = require("mongoose");

const patientHealthProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },

    dateOfBirth: { type: Date },
    sex: { type: String, enum: ["female", "male", "intersex", "prefer_not_to_say"] },
    heightCm: { type: Number, min: 20, max: 300 },
    weightKg: { type: Number, min: 1, max: 500 },

    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"],
      default: "unknown",
    },

    conditions: [{ type: String, maxlength: 150 }],
    allergies: [{ type: String, maxlength: 150 }],
    familyHistory: [{ type: String, maxlength: 200 }],

    medicines: [{
      name: { type: String, required: true, maxlength: 150 },
      prescribedDose: { type: String, maxlength: 100 },
      frequency: { type: String, maxlength: 100 },
      notes: { type: String, maxlength: 300 },
      active: { type: Boolean, default: true },
    }],

    lifestyle: {
      smoking: { type: String, maxlength: 100 },
      alcohol: { type: String, maxlength: 100 },
      activityLevel: { type: String, maxlength: 100 },
      sleepHours: { type: Number, min: 0, max: 24 },
    },

    emergencyContact: {
      name: { type: String, maxlength: 100 },
      phone: { type: String, maxlength: 30 },
      relationship: { type: String, maxlength: 50 },
    },

    profileNotes: { type: String, maxlength: 2000 },
    consentForHealthAnalysis: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PatientHealthProfile ||
  mongoose.model("PatientHealthProfile", patientHealthProfileSchema);
