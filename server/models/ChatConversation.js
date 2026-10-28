const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      required: true,
      enum: ["patient", "doctor", "receptionist", "admin", "hospital"],
    },
    title: {
      type: String,
      default: "Health Assistant Chat",
      maxlength: 100,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

const ChatConversation =
  mongoose.models.ChatConversation ||
  mongoose.model("ChatConversation", conversationSchema);

module.exports = ChatConversation;