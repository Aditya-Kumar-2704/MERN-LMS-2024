const mongoose = require("mongoose");

const liveClassSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true, index: true },
    courseTitle: { type: String, required: true },
    courseImage: { type: String, default: "" },
    instructorId: { type: String, required: true, index: true },
    instructorName: { type: String, required: true },
    provider: { type: String, default: "jitsi" },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    scheduledFor: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 60 },
    roomName: { type: String, required: true, unique: true },
    meetingLink: { type: String, required: true },
    recordingUrl: { type: String, default: "" },
    recordingPublicId: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LiveClass", liveClassSchema);
